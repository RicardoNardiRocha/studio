
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle2, XCircle, Clock, FileSearch, Hourglass, Check, AlertTriangle, History } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import type { CompanyForSintegra, SintegraJob, SintegraResult, JobStatus } from '@/lib/sintegra/types';
import type { Company } from './company-details-dialog';
import { normalizeAndSanitizeSintegraPayload } from '@/lib/sintegra/normalize';
import { cn } from '@/lib/utils';

const BATCH_CREATE_CHUNK_SIZE = 30;
const BATCH_POLLING_CHUNK_SIZE = 50;
const POLLING_INTERVAL_MS = 3000;
const MAX_GLOBAL_ATTEMPTS = 400; // Aprox. 20 minutos (400 * 3s)
const MAX_FETCH_RETRIES = 5;
const INITIAL_BACKOFF_MS = 2000;


type JobStatusFilter = 'all' | 'pending' | 'success' | 'failed';
type AttemptHistory = { round: number; sent: number; failed: number };

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

export function SintegraConsultDialog({
  open,
  onOpenChange,
  companies,
  onConsultationComplete,
}: SintegraConsultDialogProps) {
  const [step, setStep] = useState<'select' | 'progress' | 'complete'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Record<string, boolean>>({});
  const [jobFilter, setJobFilter] = useState<JobStatusFilter>('all');
  const { toast } = useToast();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [jobs, setJobs] = useState<Record<string, SintegraJob>>({});
  const [pendingRequestIds, setPendingRequestIds] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [runHistory, setRunHistory] = useState<AttemptHistory[]>([]);


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

  const filteredCompaniesForSelection = useMemo(() => {
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
    filteredCompaniesForSelection.forEach(c => {
      newSelection[c.id] = checked;
    });
    setSelectedCompanies(prev => ({ ...prev, ...newSelection }));
  };

  const startConsultations = useCallback(async (companiesToRun: CompanyForSintegra[]) => {
    if (companiesToRun.length === 0) {
      toast({ title: 'Nenhuma empresa selecionada', variant: 'destructive' });
      return;
    }
    
    setStep('progress');
    const initialJobs = companiesToRun.reduce((acc, company) => {
      acc[company.id] = { company, status: 'QUEUED' };
      return acc;
    }, {} as Record<string, SintegraJob>);
    setJobs(initialJobs);

    const allItems: { companyId: string, requestId: string | null, status: JobStatus, error: string | null }[] = [];
    let companiesFailedToCreate = 0;

    try {
      for (let i = 0; i < companiesToRun.length; i += BATCH_CREATE_CHUNK_SIZE) {
        const chunk = companiesToRun.slice(i, i + BATCH_CREATE_CHUNK_SIZE);
        const response = await fetch('/api/integrations/sintegra/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companies: chunk }),
        });

        if (!response.ok) {
            const errorBodyText = await response.text();
            console.error(`[SINTEGRA API ERROR] Falha na criação do lote. Endpoint: /api/integrations/sintegra/batch, Status: ${response.status}, Payload: ${JSON.stringify({ companies: chunk.map(c => ({cnpj: c.cnpj, uf: c.uf})) })}`);
            console.error('[SINTEGRA API ERROR] Response Body:', errorBodyText);
            // Mark all companies in this chunk as failed
            chunk.forEach(c => {
                allItems.push({ companyId: c.id, requestId: null, status: 'ERROR', error: `Falha na criação do lote (HTTP ${response.status})` });
            });
            companiesFailedToCreate += chunk.length;
            continue; // Continue to the next chunk
        }
        
        const { items } = await response.json();
        allItems.push(...items);
        companiesFailedToCreate += items.filter((item: any) => item.status === 'ERROR').length;
      }
        
        const newJobs = { ...initialJobs };
        const newPendingRequestIds: string[] = [];

        allItems.forEach((item) => {
            if (newJobs[item.companyId]) {
                if (item.status === 'ERROR') {
                    newJobs[item.companyId].status = 'ERROR';
                    newJobs[item.companyId].error = item.error || 'Erro na criação do job.';
                } else if (item.requestId) {
                    newJobs[item.companyId].status = 'PENDING';
                    newJobs[item.companyId].requestId = item.requestId;
                    newPendingRequestIds.push(item.requestId);
                } else {
                     newJobs[item.companyId].status = 'ERROR';
                     newJobs[item.companyId].error = 'API não retornou um ID de requisição.';
                }
            }
        });
        
        setJobs(newJobs);
        setPendingRequestIds(newPendingRequestIds);
        setRunHistory(prev => [...prev, { round: prev.length + 1, sent: companiesToRun.length, failed: companiesFailedToCreate }]);
        
        if (newPendingRequestIds.length > 0) {
            toast({ title: `${newPendingRequestIds.length} consultas iniciadas com sucesso`, description: 'Acompanhando o status em tempo real.' });
        } else if (companiesFailedToCreate > 0) {
            toast({ title: 'Algumas consultas não puderam ser iniciadas.', description: `${companiesFailedToCreate} falharam na criação.`, variant: 'destructive'});
            setStep('complete');
        } else {
             toast({ title: 'Nenhuma consulta pôde ser iniciada com sucesso.', variant: 'destructive'});
             setStep('complete');
        }

    } catch (error: any) {
        console.error("Falha ao criar o lote de consultas.", error);
        toast({ title: 'Erro Crítico na Criação do Lote', description: error.message, variant: 'destructive' });
        setJobs(prevJobs => {
            const failedJobs = { ...prevJobs };
            Object.keys(failedJobs).forEach(key => {
                if (failedJobs[key].status === 'QUEUED') {
                    failedJobs[key].status = 'ERROR';
                    failedJobs[key].error = 'Falha na criação do lote principal.';
                }
            });
            return failedJobs;
        });
        setStep('complete');
    }
  }, [setStep, setJobs, toast]);


  useEffect(() => {
    if (step !== 'progress' || pendingRequestIds.length === 0) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        return;
    }

    let globalAttempts = 0;

    const pollBatchStatus = async () => {
        globalAttempts++;
        if (pendingRequestIds.length === 0) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            const areAllJobsSettled = Object.values(jobs).every(j => j.status !== 'PENDING' && j.status !== 'QUEUED');
            if (areAllJobsSettled) setStep('complete');
            return;
        }

        if (globalAttempts > MAX_GLOBAL_ATTEMPTS) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setJobs(prevJobs => {
                const timedOutJobs = { ...prevJobs };
                pendingRequestIds.forEach(id => {
                    const jobToUpdateKey = Object.keys(timedOutJobs).find(key => timedOutJobs[key].requestId === id);
                    if (jobToUpdateKey) {
                        timedOutJobs[jobToUpdateKey].status = 'TIMEOUT';
                        timedOutJobs[jobToUpdateKey].error = 'Tempo de consulta global excedido.';
                    }
                });
                return timedOutJobs;
            });
            setPendingRequestIds([]);
            setStep('complete');
            return;
        }

        const currentIdsToPoll = [...pendingRequestIds];
        let nextPendingIds: string[] = [];

        for (let i = 0; i < currentIdsToPoll.length; i += BATCH_POLLING_CHUNK_SIZE) {
            const chunk = currentIdsToPoll.slice(i, i + BATCH_POLLING_CHUNK_SIZE);
            let success = false;
            
            for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt++) {
                try {
                    const response = await fetch('/api/integrations/sintegra/status-batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ requestIds: chunk }),
                    });

                    if (!response.ok) {
                        throw new Error(`API retornou status ${response.status}`);
                    }
                    
                    const results: Array<{requestId: string, status: JobStatus, data: any, error: string | null}> = await response.json();
                    
                    const newlyCompletedJobs: { companyId: string, result: SintegraResult }[] = [];
                    const chunkStillPending: string[] = [];

                    setJobs(prevJobs => {
                        const newJobs = { ...prevJobs };
                        results.forEach(result => {
                            const jobToUpdateKey = Object.keys(newJobs).find(key => newJobs[key].requestId === result.requestId);
                            if (!jobToUpdateKey || newJobs[jobToUpdateKey].status !== 'PENDING') return;

                            if (result.status === 'DONE') {
                                const normalizedData = normalizeAndSanitizeSintegraPayload(result.data || {});
                                const sintegraResult: SintegraResult = { status: 'DONE', requestId: result.requestId, data: normalizedData, updatedAt: new Date(), raw: result.data };
                                newJobs[jobToUpdateKey] = { ...newJobs[jobToUpdateKey], status: 'DONE', result: sintegraResult };
                                newlyCompletedJobs.push({ companyId: newJobs[jobToUpdateKey].company.id, result: sintegraResult });
                            } else if (result.status === 'ERROR' || result.status === 'TIMEOUT') {
                                newJobs[jobToUpdateKey] = { ...newJobs[jobToUpdateKey], status: result.status, error: result.error || 'Erro desconhecido na API' };
                            } else {
                                chunkStillPending.push(result.requestId);
                            }
                        });
                        return newJobs;
                    });

                    newlyCompletedJobs.forEach(({ companyId, result }) => onConsultationComplete(companyId, result));
                    nextPendingIds.push(...chunkStillPending);
                    success = true;
                    break;
                } catch (error: any) {
                    console.warn(`[POLL ATTEMPT ${attempt}] Falha ao buscar chunk. Erro: ${error.message}`);
                    if (attempt === MAX_FETCH_RETRIES) {
                        console.error(`[POLL FAILED] Chunk falhou após ${MAX_FETCH_RETRIES} tentativas. Marcando como TIMEOUT.`);
                        setJobs(prevJobs => {
                            const timedOutJobs = { ...prevJobs };
                            chunk.forEach(id => {
                                const jobKey = Object.keys(timedOutJobs).find(key => timedOutJobs[key].requestId === id);
                                if (jobKey && timedOutJobs[jobKey].status === 'PENDING') {
                                    timedOutJobs[jobKey].status = 'TIMEOUT';
                                    timedOutJobs[jobKey].error = `Falha de rede após ${MAX_FETCH_RETRIES} tentativas.`;
                                }
                            });
                            return timedOutJobs;
                        });
                    } else {
                        const delayMs = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1), 15000);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                }
            }
        }
        setPendingRequestIds(nextPendingIds);
    };

    pollIntervalRef.current = setInterval(pollBatchStatus, POLLING_INTERVAL_MS);

    return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [step, pendingRequestIds, jobs, setJobs, setStep, onConsultationComplete]);

  const handleStart = () => {
    const companiesToRun = companiesForSintegra.filter(c => selectedCompanies[c.id]);
    startConsultations(companiesToRun);
  };
  
  const handleClose = () => onOpenChange(false);
  
  const handleRerunFailed = () => {
    const failedJobs = Object.values(jobs).filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT');
    if (failedJobs.length > 0) {
      const failedCompanies = failedJobs.map(j => j.company);
      startConsultations(failedCompanies);
    } else {
      toast({ title: "Nenhuma falha para reenviar." });
    }
  };

  const resetState = () => {
    setStep('select');
    setSelectedCompanies({});
    setSearchTerm('');
    setJobs({});
    setPendingRequestIds([]);
    setRunHistory([]);
    if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
    }
  }

  const handleNewQueryClick = () => resetState();

  const progressStats = useMemo(() => {
    const jobValues = Object.values(jobs);
    const total = jobValues.length;
    if (total === 0) return { total: 0, success: 0, error: 0, pending: 0, progressValue: 0 };
    const success = jobValues.filter(j => j.status === 'DONE').length;
    const error = jobValues.filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT' || j.status === 'DONE_NO_DATA').length;
    const completed = success + error;
    const pending = total - completed;
    const progressValue = total > 0 ? (completed / total) * 100 : 0;
    return { total, success, error, pending, progressValue };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const allJobs = Object.values(jobs);
    if (jobFilter === 'all') return allJobs;
    if (jobFilter === 'pending') return allJobs.filter(j => j.status === 'QUEUED' || j.status === 'PENDING');
    if (jobFilter === 'success') return allJobs.filter(j => j.status === 'DONE');
    if (jobFilter === 'failed') return allJobs.filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT' || j.status === 'DONE_NO_DATA');
    return allJobs;
  }, [jobs, jobFilter]);
  
  const JobStatusIcon = ({ status }: { status: JobStatus}) => {
    switch (status) {
      case 'PENDING': case 'QUEUED': return <Hourglass className="h-4 w-4 text-muted-foreground" />;
      case 'DONE': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'DONE_NO_DATA': return <Check className="h-4 w-4 text-muted-foreground" />;
      case 'ERROR': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'TIMEOUT': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const KpiCard = ({ title, value, icon, onClick, colorClass, isActive }: { title: string; value: number; icon: React.ElementType, onClick: () => void, colorClass: string, isActive: boolean }) => {
    const Icon = icon;
    return (
        <Card className={cn('cursor-pointer hover:shadow-md transition-all', isActive ? 'ring-2 ring-primary' : '')} onClick={onClick}>
            <CardContent className="p-3">
                <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-full', colorClass)}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">{title}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Consultar Empresas no Sintegra'}
            {step === 'progress' && 'Acompanhar Consultas'}
            {step === 'complete' && 'Resultados da Consulta'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Selecione as empresas para iniciar a consulta em lote.'}
            {step === 'progress' && 'Aguarde enquanto as consultas são processadas.'}
            {step === 'complete' && 'Verifique os resultados abaixo.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="flex-grow overflow-hidden flex flex-col gap-4 min-h-0">
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
                {filteredCompaniesForSelection.map(company => (
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
          <div className="flex-grow overflow-hidden flex flex-col gap-4 min-h-0">
            <Progress value={progressStats.progressValue} className="w-full" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-center">
                <KpiCard title="Total" value={progressStats.total} icon={Search} colorClass="bg-gray-500" onClick={() => setJobFilter('all')} isActive={jobFilter === 'all'} />
                <KpiCard title="Pendentes" value={progressStats.pending} icon={Hourglass} colorClass="bg-blue-500" onClick={() => setJobFilter('pending')} isActive={jobFilter === 'pending'} />
                <KpiCard title="Sucesso" value={progressStats.success} icon={Check} colorClass="bg-green-500" onClick={() => setJobFilter('success')} isActive={jobFilter === 'success'} />
                <KpiCard title="Falhas" value={progressStats.error} icon={AlertTriangle} colorClass="bg-red-500" onClick={() => setJobFilter('failed')} isActive={jobFilter === 'failed'} />
            </div>
            <ScrollArea className="flex-grow border rounded-md">
                <div className="p-2 space-y-1">
                    {filteredJobs.map(({ company, status, error, result }) => (
                        <div key={company.id} className="p-2 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <JobStatusIcon status={status} />
                                <div className='max-w-[400px]'>
                                    <p className="font-medium truncate">{company.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {status === 'DONE' && 'Sucesso'}
                                        {status === 'DONE_NO_DATA' && 'Concluído sem dados'}
                                        {status === 'QUEUED' && 'Na fila...'}
                                        {status === 'PENDING' && 'Consultando...'}
                                        {(status === 'ERROR' || status === 'TIMEOUT') && (error || 'Erro desconhecido')}
                                    </p>
                                </div>
                            </div>
                             {result && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon"><FileSearch className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Dados Retornados para {company.name}</AlertDialogTitle>
                                        </AlertDialogHeader>
                                        <ScrollArea className="max-h-96 w-full rounded-md border">
                                            <pre className="text-xs p-4">{JSON.stringify(result.raw || result.data || result.error, null, 2)}</pre>
                                        </ScrollArea>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Fechar</AlertDialogCancel>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
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
          {step === 'progress' && <Button variant="destructive" onClick={handleClose}>Interromper e Fechar</Button>}
          {step === 'complete' && (
             <>
              <AlertDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline"><History className="mr-2 h-4 w-4" /> Ver Histórico</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Histórico de Tentativas</AlertDialogTitle>
                        <AlertDialogDescription>
                            Resumo de cada rodada de consulta executada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-60 overflow-y-auto">
                        {runHistory.map((run, index) => (
                            <div key={index} className="mb-2 rounded-lg border p-3 text-sm">
                                <p className="font-bold">Rodada {run.round}</p>
                                <p>Enviados: {run.sent}</p>
                                <p className="text-destructive">Falhas: {run.failed}</p>
                            </div>
                        ))}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsHistoryOpen(false)}>Fechar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className='flex-grow' />
              {progressStats.error > 0 && <Button variant="secondary" onClick={handleRerunFailed}>Reexecutar Falhas ({progressStats.error})</Button>}
              <Button variant="outline" onClick={handleNewQueryClick}>Nova Consulta</Button>
              <Button onClick={handleClose}>Fechar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
