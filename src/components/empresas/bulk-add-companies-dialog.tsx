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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';

interface BulkAddCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportCompleted: () => void;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const handlePartnerRegistration = async (firestore: any, company: any) => {
    if (!company.qsa || company.qsa.length === 0) {
      return;
    }
    if (company.legalNature?.includes('Empresário (Individual)') || company.legalNature?.includes('Microempreendedor Individual')) {
        return;
    }

    for (const socio of company.qsa) {
      const socioCpfCnpjRaw = socio.cnpj_cpf_do_socio || '';
      const socioCpfCnpj = socioCpfCnpjRaw.replace(/[^\d]/g, '');
      const socioNome = socio.nome_socio;

      if (!socioCpfCnpj || !socioNome) {
        continue;
      }

      try {
        const partnerRef = doc(firestore, 'partners', socioCpfCnpj);
        const partnerSnap = await getDoc(partnerRef);

        if (partnerSnap.exists()) {
          const partnerData = partnerSnap.data();
          const associatedCompanies = partnerData.associatedCompanies || [];
          if (!associatedCompanies.includes(company.name)) {
            const updatedCompanies = [...associatedCompanies, company.name];
            await updateDoc(partnerRef, { associatedCompanies: updatedCompanies });
          }
        } else {
          let formattedCpfCnpj = socioCpfCnpjRaw;
          const newPartner = {
            id: socioCpfCnpj,
            name: socio.nome_socio,
            cpf: formattedCpfCnpj,
            qualification: socio.qualificacao_socio,
            hasECPF: false,
            ecpfValidity: '',
            govBrLogin: '',
            govBrPassword: '',
            associatedCompanies: [company.name],
            otherData: '',
          };
          await setDoc(partnerRef, newPartner);
        }
      } catch (error) {
        console.error(`Erro ao processar o sócio ${socio.nome_socio} na importação em lote:`, error);
      }
    }
  };


export function BulkAddCompaniesDialog({ open, onOpenChange, onImportCompleted }: BulkAddCompaniesDialogProps) {
  const [cnpjs, setCnpjs] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failedImports, setFailedImports] = useState<{ cnpj: string; name: string; reason: string }[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const handleClose = () => {
    if (isLoading) return;
    setCnpjs('');
    setProgress(0);
    setFailedImports([]);
    onOpenChange(false);
  };

  const handleImport = async () => {
    if (!firestore || !user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para importar empresas.',
        variant: 'destructive',
      });
      return;
    }

    const cnpjList = cnpjs.split('\n').map(cnpj => cnpj.trim()).filter(cnpj => cnpj);
    if (cnpjList.length === 0) {
      toast({
        title: 'Nenhum CNPJ fornecido',
        description: 'Por favor, insira pelo menos um CNPJ na área de texto.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setFailedImports([]);

    let successCount = 0;
    const localFailedImports: { cnpj: string; name: string; reason: string }[] = [];

    const processCnpj = async (cnpj: string) => {
      const numericCnpj = cnpj.replace(/[^\d]/g, '');
      if (numericCnpj.length !== 14) {
        localFailedImports.push({ cnpj, name: 'CNPJ Inválido', reason: 'Formato incorreto' });
        return;
      }
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numericCnpj}`);
        if (!response.ok) {
            localFailedImports.push({ cnpj, name: `CNPJ ${cnpj}`, reason: `API retornou status ${response.status}`});
            return;
        }
        
        const data = await response.json();
        
        let taxRegime = "Lucro Presumido / Real";
        if (data.opcao_pelo_simples || data.simples_nacional) {
          taxRegime = "Simples Nacional";
        }

        const newCompany = {
          id: data.cnpj,
          name: data.razao_social,
          cnpj: data.cnpj,
          taxRegime,
          status: data.descricao_situacao_cadastral,
          startDate: data.data_inicio_atividade ? new Date(data.data_inicio_atividade).toLocaleDateString('pt-BR') : 'N/A',
          fantasyName: data.nome_fantasia || '',
          cnae: data.cnae_fiscal_descricao || '',
          address: `${data.logradouro || ''}, ${data.numero || ''}, ${data.complemento || ''} - ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}, ${data.cep || ''}`.replace(/ ,/g, '').replace(/,  -/g,', '),
          phone: data.ddd_telefone_1 || '',
          email: data.email || '',
          capital: data.capital_social || 0,
          legalNature: data.natureza_juridica || '',
          porte: data.porte || '',
          qsa: data.qsa || [],
          members: { [user.uid]: 'admin' },
        };
        
        const companyRef = doc(firestore, 'companies', newCompany.id);
        setDocumentNonBlocking(companyRef, newCompany, { merge: true });
        
        // Sincronizar sócios
        await handlePartnerRegistration(firestore, newCompany);
        
        successCount++;
      } catch (error) {
        console.error(`Falha ao processar CNPJ ${cnpj}:`, error);
        localFailedImports.push({ cnpj, name: `CNPJ ${cnpj}`, reason: 'Erro inesperado' });
      }
    };
    
    for (let i = 0; i < cnpjList.length; i++) {
        await processCnpj(cnpjList[i]);
        await delay(1500); 
        setProgress(((i + 1) / cnpjList.length) * 100);
    }
    
    setFailedImports(localFailedImports);

    toast({
      title: 'Importação Concluída',
      description: `${successCount} empresas importadas com sucesso, ${localFailedImports.length} falharam.`,
    });

    setIsLoading(false);
    
    if (localFailedImports.length === 0) {
        onImportCompleted();
        handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Empresas em Lote</DialogTitle>
          <DialogDescription>
            Cole uma lista de CNPJs, um por linha, para adicioná-los em massa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="cnpjs">Lista de CNPJs</Label>
            <Textarea
              id="cnpjs"
              placeholder="00.000.000/0001-00
11.111.111/0001-11
..."
              value={cnpjs}
              onChange={(e) => setCnpjs(e.target.value)}
              className="h-32"
              disabled={isLoading}
            />
          </div>
          {isLoading && (
            <div className="space-y-2">
                <Label>Progresso da Importação</Label>
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                   Processando {Math.round((progress / 100) * cnpjs.split('\n').filter(c => c).length)} de {cnpjs.split('\n').filter(c => c).length} CNPJs...
                </p>
            </div>
          )}
          {failedImports.length > 0 && !isLoading && (
             <Alert variant="destructive">
              <AlertTitle>Relatório de Falhas na Importação</AlertTitle>
              <AlertDescription>
                As seguintes empresas não puderam ser importadas:
              </AlertDescription>
              <ScrollArea className="h-24 mt-2 border rounded-md p-2">
                <ul className="text-sm">
                  {failedImports.map((fail, index) => (
                    <li key={index}><strong>{fail.cnpj}:</strong> {fail.reason}</li>
                  ))}
                </ul>
              </ScrollArea>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
            {failedImports.length > 0 ? 'Fechar' : 'Cancelar'}
          </Button>
          {!failedImports.length && (
            <Button onClick={handleImport} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Importar Empresas'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
