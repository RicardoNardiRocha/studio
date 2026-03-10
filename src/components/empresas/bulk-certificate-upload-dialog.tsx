'use client';

import { useState, useId, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, FileUp, ShieldCheck, AlertTriangle, Building, HelpCircle, CheckCircle } from 'lucide-react';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import * as forge from 'node-forge';
import { uploadCertificate } from '@/lib/storage/upload';
import { logActivity } from '@/lib/activity-log';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


interface BulkCertificateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type ProcessResult = {
    fileName: string;
    cnpj?: string;
    companyName?: string;
    status: 'success' | 'error' | 'warning';
    message: string;
}

// OID para CNPJ no certificado digital brasileiro
const CNPJ_OID = '2.16.76.1.3.3';

export function BulkCertificateUploadDialog({ open, onOpenChange, onComplete }: BulkCertificateUploadDialogProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [passwords, setPasswords] = useState<Record<string, string>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ProcessResult[]>([]);
    const { toast } = useToast();
    const firestore = useFirestore();
    const storage = useStorage();
    const { user } = useUser();

    const handleFilesChange = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        
        // Filter out files that are already selected
        const uniqueNewFiles = newFiles.filter(
            newFile => !selectedFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
        );

        const updatedFiles = [...selectedFiles, ...uniqueNewFiles];

        if (updatedFiles.length > 5) {
            toast({
                title: "Limite de arquivos excedido",
                description: "Você pode enviar no máximo 5 certificados por vez.",
                variant: "destructive",
            });
            setSelectedFiles(updatedFiles.slice(0, 5));
        } else {
            setSelectedFiles(updatedFiles);
        }
    };

    const handlePasswordChange = (fileName: string, password: string) => {
        setPasswords(prev => ({ ...prev, [fileName]: password }));
    };

    const removeFile = (fileName: string) => {
        setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
        setPasswords(prev => {
            const newPasswords = { ...prev };
            delete newPasswords[fileName];
            return newPasswords;
        });
    };
    
    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);
    
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesChange(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, [handleFilesChange]);
    
    const handleClose = () => {
        if (isLoading) return;
        setSelectedFiles([]);
        setPasswords({});
        setResults([]);
        onOpenChange(false);
        if (results.some(r => r.status === 'success')) {
            onComplete();
        }
    };

    const processCertificates = async () => {
        const filesToProcess = selectedFiles.filter(file => passwords[file.name]?.trim());
        if (filesToProcess.length === 0) {
            toast({ title: "Nenhum certificado pronto", description: "Adicione arquivos e digite as senhas.", variant: "destructive"});
            return;
        }

        setIsLoading(true);
        setResults([]);
        const processedResults: ProcessResult[] = [];

        for (const file of filesToProcess) {
            const password = passwords[file.name];
            let result: ProcessResult = {
                fileName: file.name,
                status: 'error',
                message: 'Erro desconhecido',
            };

            try {
                const fileBuffer = await file.arrayBuffer();
                const pfxAsn1 = forge.asn1.fromDer(new Uint8Array(fileBuffer).toString('binary'));
                const p12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);
                
                const certBags = p12.getBags({bagType: forge.pki.oids.certBag});
                const certBag = certBags[forge.pki.oids.certBag]?.[0];
                if (!certBag || !certBag.cert) throw new Error('Certificado inválido ou corrompido.');
                
                const certificate = certBag.cert;
                
                const subjectAttributes = certificate.subject.attributes;
                const cnpjAttribute = subjectAttributes.find((attr: { type: string; }) => attr.type === CNPJ_OID);
                let certCnpj = '';
                if (cnpjAttribute && typeof cnpjAttribute.value === 'string') {
                    certCnpj = cnpjAttribute.value.replace(/\D/g, '').slice(-14);
                } else {
                     const commonNameAttr = certificate.subject.getField('CN');
                     if (commonNameAttr && typeof commonNameAttr.value === 'string') {
                         const match = commonNameAttr.value.match(/(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2})/);
                         if (match) certCnpj = match[0].replace(/\D/g, '');
                     }
                 }
                if (!certCnpj) throw new Error('CNPJ não encontrado no certificado.');
                
                result.cnpj = certCnpj;

                const q = query(collection(firestore!, 'companies'), where('cnpj', '==', certCnpj));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) throw new Error('Empresa não encontrada no sistema.');
                
                const companyDoc = querySnapshot.docs[0];
                const companyData = companyDoc.data();
                result.companyName = companyData.name;
                
                const validity = certificate.validity.notAfter;
                const validityDateString = validity.toISOString().split('T')[0];
                const fileUrl = await uploadCertificate(storage!, `companies/${companyDoc.id}`, file);
                
                const companyDocRef = doc(firestore!, 'companies', companyDoc.id);
                setDocumentNonBlocking(companyDocRef, {
                  certificateA1Validity: validityDateString,
                  certificateA1Url: fileUrl,
                }, { merge: true });

                const certificateSubDocRef = doc(collection(firestore!, `companies/${companyDoc.id}/certificates`), 'A1');
                setDocumentNonBlocking(certificateSubDocRef, { 
                    validity: validityDateString,
                    url: fileUrl,
                    type: 'A1',
                    updatedAt: new Date().toISOString(),
                }, { merge: true });
                
                logActivity(firestore!, user!, `atualizou o certificado A1 da empresa ${companyData.name} em lote.`);
                
                result.status = 'success';
                result.message = `Vinculado com sucesso. Validade: ${validity.toLocaleDateString('pt-BR')}`;

            } catch (err: any) {
                result.message = err.message.includes('Invalid MAC') ? 'Senha inválida ou arquivo corrompido.' : err.message;
                result.status = err.message.includes('não encontrada') ? 'warning' : 'error';
            }
            processedResults.push(result);
            setResults([...processedResults]);
        }
        setIsLoading(false);
    };
    
    const getResultIcon = (status: ProcessResult['status']) => {
        switch(status) {
            case 'success': return <CheckCircle className="text-green-500" />;
            case 'warning': return <AlertTriangle className="text-yellow-500" />;
            case 'error': return <AlertTriangle className="text-destructive" />;
            default: return <HelpCircle className="text-muted-foreground" />;
        }
    };
    
    const allPasswordsEntered = selectedFiles.length > 0 && selectedFiles.every(file => passwords[file.name]?.trim());

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Atualizar Certificados em Lote</DialogTitle>
                    <DialogDescription>
                        Arraste ou selecione até 5 certificados A1 (.pfx). Depois, preencha as senhas e processe todos de uma vez.
                    </DialogDescription>
                </DialogHeader>

                {results.length === 0 ? (
                  <div className="space-y-4 py-4">
                    {selectedFiles.length === 0 ? (
                        <Label
                          htmlFor="file-upload"
                          className={cn(
                            "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted",
                            isDragging && "ring-2 ring-primary border-solid bg-primary/10"
                          )}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Clique para selecionar</span> ou arraste e solte
                                </p>
                                <p className="text-xs text-muted-foreground">Até 5 arquivos .pfx</p>
                            </div>
                            <Input 
                                id="file-upload" 
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept=".pfx"
                                onChange={(e) => handleFilesChange(e.target.files)}
                            />
                        </Label>
                    ) : (
                      <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-4">
                           {selectedFiles.map((file) => (
                                <div key={file.name} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg relative">
                                    <div className="space-y-1.5 overflow-hidden">
                                        <Label htmlFor={`password-${file.name}`} className="truncate">{file.name}</Label>
                                        <p className="text-xs text-muted-foreground">Tamanho: {(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Input 
                                          id={`password-${file.name}`} 
                                          type="password" 
                                          placeholder="Senha do certificado"
                                          value={passwords[file.name] || ''}
                                          onChange={(e) => handlePasswordChange(file.name, e.target.value)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeFile(file.name)}>
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                            {selectedFiles.length < 5 && (
                                <Label htmlFor="file-add-more" className="flex items-center justify-center w-full py-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                    <FileUp className="w-5 h-5 mr-2 text-muted-foreground"/>
                                    Adicionar mais arquivos
                                     <Input 
                                        id="file-add-more" 
                                        type="file" 
                                        className="hidden" 
                                        multiple 
                                        accept=".pfx"
                                        onChange={(e) => handleFilesChange(e.target.files)}
                                    />
                                </Label>
                            )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <h3 className="font-semibold">Resultado do Processamento</h3>
                        <ScrollArea className="max-h-[60vh] p-1">
                            <div className="space-y-3 pr-4">
                                {results.map((res, index) => (
                                    <div key={index} className="flex items-start gap-4 rounded-lg border p-3">
                                        <div className="mt-1">{getResultIcon(res.status)}</div>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium text-sm break-all">{res.fileName}</p>
                                            {res.cnpj && <p className="text-xs font-mono"><Building className="inline-block mr-1 h-3 w-3" /> {res.companyName} ({res.cnpj})</p>}
                                            <p className="text-xs text-muted-foreground">{res.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
                
                <DialogFooter>
                    {results.length > 0 ? (
                         <Button onClick={handleClose}>Fechar</Button>
                    ) : (
                        <>
                            <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
                            <Button onClick={processCertificates} disabled={isLoading || selectedFiles.length === 0 || !allPasswordsEntered}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                Processar Certificados
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
