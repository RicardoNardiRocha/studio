'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, AlertTriangle } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';
import type { Company } from './company-details-dialog';

interface BulkSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncCompleted: () => void;
  companies: Company[];
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function BulkSyncDialog({ open, onOpenChange, onSyncCompleted, companies }: BulkSyncDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [unframedCompanies, setUnframedCompanies] = useState<{ name: string; oldRegime: string; newRegime: string }[]>([]);
  const [failedSyncs, setFailedSyncs] = useState<{ name: string; reason: string }[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const handleClose = () => {
    if (isLoading) return;
    setProgress(0);
    setUnframedCompanies([]);
    setFailedSyncs([]);
    onOpenChange(false);
  };

  const handleSync = async () => {
    if (!firestore || !user || !companies) {
      toast({
        title: 'Erro',
        description: 'Serviços indisponíveis ou nenhuma empresa para sincronizar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setUnframedCompanies([]);
    setFailedSyncs([]);

    let successCount = 0;
    const localUnframed: { name: string; oldRegime: string; newRegime: string }[] = [];
    const localFailed: { name: string; reason: string }[] = [];

    const totalCompanies = companies.length;

    for (let i = 0; i < totalCompanies; i++) {
        const company = companies[i];
        const numericCnpj = company.cnpj.replace(/[^\d]/g, '');

        try {
            await delay(1500); // Delay to avoid hitting API rate limits
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numericCnpj}`);

            if (!response.ok) {
                localFailed.push({ name: company.name, reason: `API retornou status ${response.status}` });
                continue;
            }

            const data = await response.json();
            
            let newTaxRegime = "Lucro Presumido / Real";
            if (data.opcao_pelo_simples || data.simples_nacional) {
                newTaxRegime = "Simples Nacional";
            }
            
            if (company.taxRegime === 'Simples Nacional' && newTaxRegime !== 'Simples Nacional') {
                localUnframed.push({ name: company.name, oldRegime: company.taxRegime, newRegime });
            }

            const updates: Partial<Company> = {
                status: data.descricao_situacao_cadastral,
                taxRegime: newTaxRegime,
                address: `${data.logradouro || ''}, ${data.numero || ''}, ${data.complemento || ''} - ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}, ${data.cep || ''}`.replace(/ ,/g, '').replace(/,  -/g,', '),
            };

            const companyRef = doc(firestore, 'companies', company.id);
            setDocumentNonBlocking(companyRef, updates, { merge: true });
            successCount++;

        } catch (error: any) {
            localFailed.push({ name: company.name, reason: error.message || 'Erro desconhecido' });
        } finally {
            setProgress(((i + 1) / totalCompanies) * 100);
        }
    }

    setUnframedCompanies(localUnframed);
    setFailedSyncs(localFailed);
    setIsLoading(false);

    toast({
        title: 'Sincronização Concluída',
        description: `${successCount} empresas verificadas. ${localUnframed.length} desenquadramentos detectados. ${localFailed.length} falhas.`,
        duration: 8000,
    });
    
    if (localUnframed.length === 0 && localFailed.length === 0) {
        onSyncCompleted();
        handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sincronizar Empresas em Lote</DialogTitle>
          <DialogDescription>
            Verifique e atualize os dados de todas as empresas cadastradas com a Receita Federal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            {!isLoading && unframedCompanies.length === 0 && failedSyncs.length === 0 && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                        Esta ação irá verificar <strong>{companies.length} empresas</strong>. O processo pode levar alguns minutos devido a limites da API externa.
                    </AlertDescription>
                </Alert>
            )}

            {isLoading && (
                <div className="space-y-2">
                    <Label>Progresso da Sincronização</Label>
                    <Progress value={progress} />
                    <p className="text-sm text-muted-foreground text-center">
                        Verificando {Math.round((progress / 100) * companies.length)} de {companies.length} empresas...
                    </p>
                </div>
            )}

            {!isLoading && unframedCompanies.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Empresas Desenquadradas do Simples Nacional!</AlertTitle>
                    <ScrollArea className="h-24 mt-2 border rounded-md p-2">
                        <ul className="text-sm">
                            {unframedCompanies.map((c, i) => (
                                <li key={i}><strong>{c.name}</strong>: {c.newRegime}</li>
                            ))}
                        </ul>
                    </ScrollArea>
                </Alert>
            )}

            {!isLoading && failedSyncs.length > 0 && (
                <Alert variant="default">
                     <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Falhas na Sincronização</AlertTitle>
                     <ScrollArea className="h-24 mt-2 border rounded-md p-2">
                        <ul className="text-sm">
                        {failedSyncs.map((fail, index) => (
                            <li key={index}><strong>{fail.name}:</strong> {fail.reason}</li>
                        ))}
                        </ul>
                    </ScrollArea>
                </Alert>
            )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
            Fechar
          </Button>
          {!isLoading && (
             <Button onClick={handleSync} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Verificar ${companies.length} Empresas`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
