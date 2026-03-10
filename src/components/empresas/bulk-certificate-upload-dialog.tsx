'use client';

import { useState, useId } from 'react';
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
import { Loader2, X, PlusCircle, FileUp, ShieldCheck, AlertTriangle, Building, HelpCircle, CheckCircle } from 'lucide-react';
import { useFirestore, useStorage, useUser } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import * as forge from 'node-forge';
import { uploadCertificate } from '@/lib/storage/upload';
import { logActivity } from '@/lib/activity-log';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface BulkCertificateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type CertRow = {
  id: string;
  file: File | null;
  password: string;
};

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
    const uniqueId = useId();
    const [rows, setRows] = useState<CertRow[]>([{ id: `row-${uniqueId}-0`, file: null, password: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ProcessResult[]>([]);
    const { toast } = useToast();
    const firestore = useFirestore();
    const storage = useStorage();
    const { user } = useUser();

    const addRow = () => {
        if (rows.length < 5) {
            setRows(prev => [...prev, { id: `row-${uniqueId}-${prev.length}`, file: null, password: '' }]);
        }
    };

    const removeRow = (id: string) => {
        setRows(prev => prev.filter(row => row.id !== id));
    };

    const handleFileChange = (id: string, file: File | null) => {
        setRows(prev => prev.map(row => row.id === id ? { ...row, file } : row));
    };

    const handlePasswordChange = (id: string, password: string) => {
        setRows(prev => prev.map(row => row.id === id ? { ...row, password } : row));
    };
    
    const handleClose = () => {
        if (isLoading) return;
        setRows([{ id: `row-${uniqueId}-0`, file: null, password: '' }]);
        setResults([]);
        onOpenChange(false);
        if (results.some(r => r.status === 'success')) {
            onComplete();
        }
    };

    const processCertificates = async () => {
        const validRows = rows.filter(r => r.file && r.password);
        if (validRows.length === 0) {
            toast({ title: "Nenhum certificado para processar", description: "Por favor, adicione um arquivo .pfx e sua senha.", variant: "destructive"});
            return;
        }

        setIsLoading(true);
        setResults([]);

        const processedResults: ProcessResult[] = [];

        for (const row of validRows) {
            let result: ProcessResult = {
                fileName: row.file!.name,
                status: 'error',
                message: 'Erro desconhecido',
            };

            try {
                const fileBuffer = await row.file!.arrayBuffer();
                const pfxAsn1 = forge.asn1.fromDer(new Uint8Array(fileBuffer).toString('binary'));
                const p12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, row.password);
                
                const certBags = p12.getBags({bagType: forge.pki.oids.certBag});
                const certBag = certBags[forge.pki.oids.certBag]?.[0];
                if (!certBag || !certBag.cert) {
                    throw new Error('Certificado inválido ou corrompido.');
                }
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
                         if (match) {
                             certCnpj = match[0].replace(/\D/g, '');
                         }
                     }
                 }
                if (!certCnpj) {
                    throw new Error('CNPJ não encontrado no certificado.');
                }
                result.cnpj = certCnpj;

                const q = query(collection(firestore!, 'companies'), where('cnpj', '==', certCnpj));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    throw new Error('Empresa não encontrada no sistema.');
                }
                const companyDoc = querySnapshot.docs[0];
                const companyData = companyDoc.data();
                result.companyName = companyData.name;
                
                const validity = certificate.validity.notAfter;
                const validityDateString = validity.toISOString().split('T')[0];
                const fileUrl = await uploadCertificate(storage!, `companies/${companyDoc.id}`, row.file!);
                
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
                if(err.message.includes('Invalid MAC')) {
                    result.message = 'Senha inválida ou arquivo corrompido.';
                } else {
                    result.message = err.message;
                }
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
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Atualizar Certificados em Lote</DialogTitle>
                    <DialogDescription>
                        Envie até 5 certificados A1 (.pfx) com suas respectivas senhas. O sistema identificará o CNPJ e vinculará automaticamente à empresa.
                    </DialogDescription>
                </DialogHeader>

                {results.length === 0 ? (
                    <div className="space-y-4 py-4">
                        <ScrollArea className="max-h-[60vh] p-1">
                            <div className="space-y-4 pr-4">
                                {rows.map((row, index) => (
                                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg relative">
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`file-${row.id}`}>Arquivo .pfx</Label>
                                            <Input id={`file-${row.id}`} type="file" accept=".pfx" onChange={(e) => handleFileChange(row.id, e.target.files ? e.target.files[0] : null)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`password-${row.id}`}>Senha do Certificado</Label>
                                            <Input id={`password-${row.id}`} type="password" value={row.password} onChange={(e) => handlePasswordChange(row.id, e.target.value)} />
                                        </div>
                                        {rows.length > 1 && (
                                            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeRow(row.id)}>
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        {rows.length < 5 && (
                            <Button variant="outline" onClick={addRow} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Outro Certificado
                            </Button>
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
                            <Button onClick={processCertificates} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                                Processar Certificados
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
