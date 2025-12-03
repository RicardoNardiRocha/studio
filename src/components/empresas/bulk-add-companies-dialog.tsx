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
import { doc } from 'firebase/firestore';
import { Progress } from '../ui/progress';

interface BulkAddCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportCompleted: () => void;
}

export function BulkAddCompaniesDialog({ open, onOpenChange, onImportCompleted }: BulkAddCompaniesDialogProps) {
  const [cnpjs, setCnpjs] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

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

    let successCount = 0;
    let failureCount = 0;

    const processCnpj = async (cnpj: string) => {
      const numericCnpj = cnpj.replace(/[^\d]/g, '');
      if (numericCnpj.length !== 14) {
        failureCount++;
        return;
      }
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numericCnpj}`);
        if (!response.ok) throw new Error('CNPJ não encontrado ou API falhou');
        
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
        successCount++;
      } catch (error) {
        console.error(`Falha ao processar CNPJ ${cnpj}:`, error);
        failureCount++;
      }
    };
    
    for (let i = 0; i < cnpjList.length; i++) {
        await processCnpj(cnpjList[i]);
        setProgress(((i + 1) / cnpjList.length) * 100);
    }

    toast({
      title: 'Importação Concluída',
      description: `${successCount} empresas importadas com sucesso, ${failureCount} falharam.`,
    });

    setIsLoading(false);
    onImportCompleted();
    onOpenChange(false);
    setCnpjs('');
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              placeholder="00.000.000/0001-00\n11.111.111/0001-11\n..."
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
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Importar Empresas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
