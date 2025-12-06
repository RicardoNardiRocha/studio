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
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import * as forge from 'node-forge';
import type { Partner } from './partner-details-dialog';

interface EcpfUploadDialogProps {
  partner: Partner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCertificateUpdated: () => void;
}

// OID para CPF no certificado digital brasileiro
const CPF_OID = '2.16.76.1.3.1';

export function EcpfUploadDialog({
  partner,
  open,
  onOpenChange,
  onCertificateUpdated,
}: EcpfUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

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
    if (!firestore) {
      toast({ title: "Erro", description: "Serviço de banco de dados não disponível.", variant: "destructive"});
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

        // Extrair CPF do certificado
        const subjectAttributes = certificate.subject.attributes;
        const cpfAttribute = subjectAttributes.find(attr => attr.type === CPF_OID);
        
        let certCpf = '';
        if (cpfAttribute && typeof cpfAttribute.value === 'string') {
            certCpf = cpfAttribute.value.replace(/\D/g, '');
        } else {
            const commonNameAttr = certificate.subject.getField('CN');
            if (commonNameAttr && typeof commonNameAttr.value === 'string') {
                const match = commonNameAttr.value.match(/(\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2})/);
                if (match) {
                    certCpf = match[0].replace(/\D/g, '');
                }
            }
        }
        
        if (!certCpf) {
            throw new Error('Não foi possível extrair o CPF do certificado.');
        }

        const partnerCpf = partner.cpf.replace(/\D/g, '');
        if (certCpf !== partnerCpf) {
            throw new Error(`Este certificado pertence a outro CPF (${certCpf}). Você está tentando adicioná-lo para o sócio com CPF ${partnerCpf}.`);
        }

        const validity = certificate.validity.notAfter;
        const validityDateString = validity.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        const partnerRef = doc(firestore, 'partners', partner.id);
        setDocumentNonBlocking(partnerRef, { 
            ecpfValidity: validityDateString,
            hasECPF: true,
        }, { merge: true });

        toast({
          title: 'Certificado Processado!',
          description: `A data de validade (${new Date(validity).toLocaleDateString('pt-BR')}) foi salva para ${partner.name}.`,
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
          <DialogTitle>Adicionar/Atualizar e-CPF</DialogTitle>
          <DialogDescription>
            Faça o upload do arquivo .pfx e digite a senha. O sistema irá validar o CPF e salvará apenas a data de validade. O arquivo e a senha não serão armazenados.
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
              'Ler e Salvar Validade'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
