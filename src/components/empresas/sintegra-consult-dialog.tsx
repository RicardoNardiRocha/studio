'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { Loader2, Search, CheckCircle2, XCircle, Clock, FileSearch } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { getSintegraStatus, startSintegraJob } from '@/lib/sintegra/api';
import type { CompanyForSintegra, SintegraJob, SintegraResult, SintegraApiPayload } from '@/lib/sintegra/types';
import type { Company } from './company-details-dialog';
import { normalizeAndSanitizeSintegraPayload } from '@/lib/sintegra/normalize';

const CONCURRENCY_LIMIT = 5;
const POLLING_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 30; // 30 attempts * 3s interval = 90s timeout

interface SintegraConsultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onConsultationComplete: (companyId: string, result: SintegraResult) => void;
}

const getUfFromAddress = (address: string = ''): string => {
  const match = address.match(/-\s([A-Z]{2})(?:\s*,|\s*$)/);
  return match ? match[1] : '';
};

export function SintegraConsultDialog({ open, onOpenChange, companies, onConsultationComplete }: SintegraConsultDialogProps) {
  const [step, setStep] = useState<'select' | 'progress' | 'complete'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Record<string, boolean>>({});
  const [jobs, setJobs] = useState<Record<string, SintegraJob>>({});
  const { toast } = useToast();
  const activePolls = useRef(new Set<string>());


  const companiesForSintegra = useMemo((): CompanyForSintegra[] => {
    return companies
      .map(c => ({
        id: c.id,
        name: c.name,
        cnpj: c.cnpj.replace(/\D/g, ''),
        uf: getUfFromAddress(c.address),
      }))
      .filter(c => c.uf);
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companiesForSintegra;
    const lowercasedFilter = searchTerm.toLowerCase();
    return companiesForSintegra.filter(
      c =>
        c.name.toLowerCase().includes(lowercasedFilter) ||
        c.cnpj.includes(lowercasedFilter)
    );
  }, [companiesForSintegra, searchTerm]);

  const handleToggleAll = (checked: boolean) => {
    const newSelection: Record<string, boolean> = {};
    filteredCompanies.forEach(c => {
      newSelection[c.id] = checked;
    });
    setSelectedCompanies(prev => ({ ...prev, ...newSelection }));
  };

  const processJob = useCallback(async (company: CompanyForSintegra) => {
    setJobs(prev => ({ ...prev, [company.id]: { company, status: 'PENDING' } }));
    
    try {
        const { requestId } = await startSintegraJob(company.cnpj, company.uf);
        setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: 'PENDING', requestId } }));

        let attempts = 0;
        const intervalId = setInterval(async () => {
            if (!activePolls.current.has(requestId)) {
                clearInterval(intervalId);
                return;
            }

            attempts++;
            if (attempts > MAX_ATTEMPTS) {
                clearInterval(intervalId);
                activePolls.current.delete(requestId);
                const result: SintegraResult = { status: 'TIMEOUT', requestId, data: null, updatedAt: new Date(), error: 'Tempo de consulta excedido.' };
                setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: 'TIMEOUT', error: result.error, result } }));
                onConsultationComplete(company.id, result);
                return;
            }

            try {
                const { status, payload, error } = await getSintegraStatus(requestId);
                if (status === 'DONE') {
                    clearInterval(intervalId);
                    activePolls.current.delete(requestId);
                    const normalizedData = normalizeAndSanitizeSintegraPayload(payload || {});
                    const result: SintegraResult = { status: 'DONE', requestId, data: normalizedData, updatedAt: new Date(), raw: payload };
                    setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: 'DONE', result } }));
                    onConsultationComplete(company.id, result);
                } else if (status === 'ERROR') {
                    clearInterval(intervalId);
                    activePolls.current.delete(requestId);
                    const result: SintegraResult = { status: 'ERROR', requestId, data: null, updatedAt: new Date(), error: error || 'Erro desconhecido na API.' };
                    setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: 'ERROR', error: result.error, result } }));
                    onConsultationComplete(company.id, result);
                }
                // If PENDING, do nothing and let it poll again.
            } catch (pollError: any) {
                clearInterval(intervalId);
                activePolls.current.delete(requestId);
                const result: SintegraResult = { status: 'ERROR', requestId, data: null, updatedAt: new Date(), error: pollError.message || 'Falha ao consultar status.' };
                setJobs(prev => ({...prev, [company.id]: { ...prev[company.id], status: 'ERROR', error: result.error, result } }));
                onConsultationComplete(company.id, result);
            }
        }, POLLING_INTERVAL_MS);
        activePolls.current.add(requestId);

    } catch (startError: any) {
        const result: SintegraResult = { status: 'ERROR', requestId: 'N/A', data: null, updatedAt: new Date(), error: startError.message || 'Falha ao iniciar a consulta.' };
        setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: 'ERROR', error: result.error, result } }));
        onConsultationComplete(company.id, result);
    }
  }, [onConsultationComplete]);


  const startConsultations = useCallback((companiesToRun: CompanyForSintegra[]) => {
    if (companiesToRun.length === 0) {
      setStep('complete');
      return;
    }
    
    setStep('progress');
    const initialJobs = companiesToRun.reduce((acc, company) => {
      acc[company.id] = { company, status: 'QUEUED' };
      return acc;
    }, {} as Record<string, SintegraJob>);
    setJobs(initialJobs);

    const queue = [...companiesToRun];
    let running = 0;

    const processQueue = () => {
      while (running < CONCURRENCY_LIMIT && queue.length > 0) {
        const companyToProcess = queue.shift();
        if (companyToProcess) {
          running++;
          processJob(companyToProcess).finally(() => {
            running--;
            processQueue();
          });
        }
      }
    };
    processQueue();
  }, [processJob]);
  
  useEffect(() => {
    const jobValues = Object.values(jobs);
    if (step === 'progress' && jobValues.length > 0 && jobValues.every(j => j.status !== 'QUEUED' && j.status !== 'PENDING')) {
        const errors = jobValues.filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT').length;
        const success = jobValues.length - errors;
        toast({
            title: 'Consultas Finalizadas',
            description: `${success} consultas concluídas, ${errors} falhas.`,
            variant: errors > 0 ? 'destructive' : 'default',
        });
        setStep('complete');
    }
  }, [jobs, step, toast]);


  const handleStart = () => {
    const companiesToRun = companiesForSintegra.filter(c => selectedCompanies[c.id]);
    if (companiesToRun.length === 0) {
      toast({ title: 'Nenhuma empresa selecionada', variant: 'destructive' });
      return;
    }
    startConsultations(companiesToRun);
  };

  const handleRerun = () => {
    const failedCompanies = Object.values(jobs)
        .filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT')
        .map(j => j.company);
    startConsultations(failedCompanies);
  };
  
  const handleClose = () => {
    activePolls.current.forEach(id => activePolls.current.delete(id));
    onOpenChange(false);
    setTimeout(() => {
        setStep('select');
        setSelectedCompanies({});
        setJobs({});
        setSearchTerm('');
    }, 300);
  }

  const progressStats = useMemo(() => {
    const jobValues = Object.values(jobs);
    const total = jobValues.length;
    if (total === 0) return { total: 0, done: 0, error: 0, pending: 0, progressValue: 0 };

    const done = jobValues.filter(j => j.status === 'DONE').length;
    const error = jobValues.filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT').length;
    const completed = done + error;
    const pending = total - completed;
    const progressValue = total > 0 ? (completed / total) * 100 : 0;

    return { total, done, error, pending, progressValue };
  }, [jobs]);
  
  const JobStatusIcon = ({ status }: { status: SintegraJob['status']}) => {
    switch (status) {
      case 'PENDING':
      case 'QUEUED':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'TIMEOUT':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Consultar Empresas no Sintegra'}
            {step === 'progress' && 'Consultando...'}
            {step === 'complete' && 'Consulta Finalizada'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Selecione as empresas para iniciar a consulta em lote.'}
            {step === 'progress' && `Aguarde enquanto as consultas são processadas. ${progressStats.pending} de ${progressStats.total} restantes.`}
            {step === 'complete' && 'Verifique os resultados abaixo.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="flex-grow overflow-hidden flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                onCheckedChange={checked => handleToggleAll(Boolean(checked))}
              />
              <Label htmlFor="select-all">Selecionar todas as empresas visíveis</Label>
            </div>
            <ScrollArea className="flex-grow border rounded-md">
              <div className="p-4 space-y-2">
                {filteredCompanies.map(company => (
                  <div key={company.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={company.id}
                        checked={selectedCompanies[company.id] || false}
                        onCheckedChange={checked =>
                          setSelectedCompanies(prev => ({ ...prev, [company.id]: !!checked }))
                        }
                      />
                      <div>
                        <Label htmlFor={company.id} className="font-medium">{company.name}</Label>
                        <p className="text-xs text-muted-foreground">{company.cnpj} - {company.uf}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-grow overflow-hidden flex flex-col gap-4">
            <Progress value={progressStats.progressValue} />
            <div className="grid grid-cols-4 gap-2 text-center">
              <Card><CardContent className="p-2"><p className="text-lg font-bold">{progressStats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
              <Card><CardContent className="p-2"><p className="text-lg font-bold">{progressStats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></CardContent></Card>
              <Card><CardContent className="p-2"><p className="text-lg font-bold text-green-500">{progressStats.done}</p><p className="text-xs text-muted-foreground">Sucesso</p></CardContent></Card>
              <Card><CardContent className="p-2"><p className="text-lg font-bold text-destructive">{progressStats.error}</p><p className="text-xs text-muted-foreground">Falhas</p></CardContent></Card>
            </div>
            <ScrollArea className="flex-grow border rounded-md">
                <div className="p-4 space-y-1">
                    {Object.values(jobs).map(({ company, status, error }) => (
                        <div key={company.id} className="p-2 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <JobStatusIcon status={status} />
                                <div>
                                    <p className="font-medium">{company.name}</p>
                                    <p className="text-xs text-muted-foreground">{error || `${status}...`}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {step === 'select' && (
            <>
              <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleStart}>Iniciar Consultas</Button>
            </>
          )}
          {step === 'progress' && <Button variant="destructive" onClick={handleClose}>Cancelar Consultas</Button>}
          {step === 'complete' && (
             <>
              {progressStats.error > 0 && <Button variant="outline" onClick={handleRerun}>Reexecutar Falhas</Button>}
              <Button onClick={handleClose}>Fechar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
