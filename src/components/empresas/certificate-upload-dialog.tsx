'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useFirestore, useStorage } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import * as forge from 'node-forge';
import type { Company } from './company-details-dialog';
import { uploadCertificate } from '@/lib/storage/upload';

interface CertificateUploadDialogProps {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCertificateUpdated: () => void;
}

// OID para CNPJ no certificado digital brasileiro
const CNPJ_OID = '2.16.76.1.3.3';

export function CertificateUploadDialog({
  company,
  open,
  onOpenChange,
  onCertificateUpdated,
}: CertificateUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleProcessCertificate = async () => {
    if (!file || !password) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, selecione um arquivo .pfx e digite a senha.',
        variant: 'destructive',
      });
      return;
    }
    if (!firestore || !storage) {
      toast({ title: "Erro", description: "Serviço de banco de dados ou armazenamento não disponível.", variant: "destructive"});
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const pfxAsn1 = forge.asn1.fromDer(e.target?.result as string);
        const p12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);
        
        const certBags = p12.getBags({bagType: forge.pki.oids.certBag});
        const certBag = certBags[forge.pki.oids.certBag]?.[0];

        if (!certBag) {
          throw new Error('Nenhum certificado encontrado no arquivo PFX.');
        }
        
        const certificate = certBag.cert;
        if (!certificate) {
             throw new Error('Não foi possível ler o certificado do arquivo.');
        }

        // Extrair CNPJ do certificado
        const subjectAttributes = certificate.subject.attributes;
        const cnpjAttribute = subjectAttributes.find(attr => attr.type === CNPJ_OID);
        
        let certCnpj = '';
        if (cnpjAttribute && typeof cnpjAttribute.value === 'string') {
            // O valor pode vir com um prefixo, ex: "21676122" + CNPJ. Removemos o que não for número.
            certCnpj = cnpjAttribute.value.replace(/\D/g, '').slice(-14);
        } else {
             // Fallback para o campo `commonName` (CN) se o OID não estiver presente
            const commonNameAttr = certificate.subject.getField('CN');
            if (commonNameAttr && typeof commonNameAttr.value === 'string') {
                const match = commonNameAttr.value.match(/(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2})/);
                if (match) {
                    certCnpj = match[0].replace(/\D/g, '');
                }
            }
        }
        
        if (!certCnpj) {
            throw new Error('Não foi possível extrair o CNPJ do certificado.');
        }

        // Validar se o CNPJ do certificado é o mesmo da empresa
        const companyCnpj = company.cnpj.replace(/\D/g, '');
        if (certCnpj !== companyCnpj) {
            throw new Error(`Este certificado pertence a outro CNPJ (${certCnpj}). Você está tentando adicioná-lo para a empresa com CNPJ ${companyCnpj}.`);
        }

        const validity = certificate.validity.notAfter;
        const validityDateString = validity.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        const fileUrl = await uploadCertificate(storage, `companies/${company.id}`, file);

        const companyRef = doc(firestore, 'companies', company.id);
        setDocumentNonBlocking(companyRef, { 
            certificateA1Validity: validityDateString,
            certificateA1Url: fileUrl,
        }, { merge: true });

        toast({
          title: 'Certificado Processado!',
          description: `A data de validade foi salva e o arquivo foi armazenado para a empresa ${company.name}.`,
        });

        onCertificateUpdated();
        onOpenChange(false);
        setFile(null);
        setPassword('');

      } catch (error: any) {
        console.error('Failed to process certificate:', error);
        toast({
          title: 'Erro ao processar certificado',
          description: error.message || 'Verifique se o arquivo e a senha estão corretos. O arquivo pode estar corrompido ou a senha incorreta.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar/Atualizar Certificado A1</DialogTitle>
          <DialogDescription>
            Faça o upload do arquivo .pfx e digite a senha. O sistema validará o CNPJ, salvará o arquivo e a data de validade. A senha não será armazenada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="pfx-file">Arquivo do Certificado (.pfx)</Label>
            <Input id="pfx-file" type="file" accept=".pfx" onChange={handleFileChange} />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">Senha do Certificado</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleProcessCertificate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Processar e Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
