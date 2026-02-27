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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle2, XCircle, Clock, FileSearch, Hourglass, Check, AlertTriangle } from 'lucide-react';
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

type JobStatusFilter = 'all' | 'pending' | 'success' | 'failed';

interface SintegraConsultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onConsultationComplete: (companyId: string, result: SintegraResult) => void;
  jobs: Record<string, SintegraJob>;
  setJobs: React.Dispatch<React.SetStateAction<Record<string, SintegraJob>>>;
  step: 'select' | 'progress' | 'complete';
  setStep: React.Dispatch<React.SetStateAction<'select' | 'progress' | 'complete'>>;
  onNewQuery: () => void;
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
  jobs,
  setJobs,
  step,
  setStep,
  onNewQuery,
}: SintegraConsultDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Record<string, boolean>>({});
  const [jobFilter, setJobFilter] = useState<JobStatusFilter>('all');
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

  const processJob = useCallback(async (company: CompanyForSintegra) => {
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
                setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: 'TIMEOUT', error: 'Tempo de consulta excedido.' } }));
                return;
            }

            try {
                const { status, payload, error } = await getSintegraStatus(requestId);
                if (status === 'DONE') {
                    clearInterval(intervalId);
                    activePolls.current.delete(requestId);
                    const normalizedData = normalizeAndSanitizeSintegraPayload(payload || {});
                    const result: SintegraResult = { status: 'DONE', requestId, data: normalizedData, updatedAt: new Date(), raw: payload };
                    const finalStatus = result.data ? 'DONE' : 'DONE_NO_DATA';
                    setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: finalStatus, result } }));
                    if (finalStatus === 'DONE') {
                       onConsultationComplete(company.id, result);
                    }
                } else if (status === 'ERROR') {
                    clearInterval(intervalId);
                    activePolls.current.delete(requestId);
                    const result: SintegraResult = { status: 'ERROR', requestId, data: null, updatedAt: new Date(), error: error || 'Erro desconhecido na API.' };
                    setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: 'ERROR', error: result.error, result } }));
                }
            } catch (pollError: any) {
                clearInterval(intervalId);
                activePolls.current.delete(requestId);
                setJobs(prev => ({...prev, [company.id]: { ...prev[company.id], status: 'ERROR', error: pollError.message || 'Falha ao consultar status.' } }));
            }
        }, POLLING_INTERVAL_MS);
        activePolls.current.add(requestId);

    } catch (startError: any) {
        setJobs(prev => ({ ...prev, [company.id]: { ...prev[company.id], status: 'ERROR', error: startError.message || 'Falha ao iniciar a consulta.' } }));
    }
  }, [setJobs, onConsultationComplete]);


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
  }, [processJob, setStep, setJobs]);
  
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
  }, [jobs, step, toast, setStep]);


  const handleStart = () => {
    const companiesToRun = companiesForSintegra.filter(c => selectedCompanies[c.id]);
    if (companiesToRun.length === 0) {
      toast({ title: 'Nenhuma empresa selecionada', variant: 'destructive' });
      return;
    }
    startConsultations(companiesToRun);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }
  
  const handleRerunFailed = () => {
    const failedCompanies = Object.values(jobs)
      .filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT')
      .map(j => j.company);
    startConsultations(failedCompanies);
  };

  const handleNewQueryClick = () => {
    setSelectedCompanies({});
    setSearchTerm('');
    onNewQuery();
  };

  const progressStats = useMemo(() => {
    const jobValues = Object.values(jobs);
    const total = jobValues.length;
    if (total === 0) return { total: 0, done: 0, error: 0, pending: 0, progressValue: 0 };

    const success = jobValues.filter(j => j.status === 'DONE' || j.status === 'DONE_NO_DATA').length;
    const error = jobValues.filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT').length;
    const completed = success + error;
    const pending = total - completed;
    const progressValue = total > 0 ? (completed / total) * 100 : 0;

    return { total, success, error, pending, progressValue };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const allJobs = Object.values(jobs);
    if (jobFilter === 'all') return allJobs;
    if (jobFilter === 'pending') return allJobs.filter(j => j.status === 'QUEUED' || j.status === 'PENDING');
    if (jobFilter === 'success') return allJobs.filter(j => j.status === 'DONE' || j.status === 'DONE_NO_DATA');
    if (jobFilter === 'failed') return allJobs.filter(j => j.status === 'ERROR' || j.status === 'TIMEOUT');
    return allJobs;
  }, [jobs, jobFilter]);
  
  const JobStatusIcon = ({ status }: { status: SintegraJob['status']}) => {
    switch (status) {
      case 'PENDING':
      case 'QUEUED':
        return <Hourglass className="h-4 w-4 text-muted-foreground" />;
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'DONE_NO_DATA':
        return <Check className="h-4 w-4 text-muted-foreground" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'TIMEOUT':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const KpiCard = ({ title, value, icon, onClick, colorClass, isActive }: { title: string; value: number; icon: React.ElementType, onClick: () => void, colorClass: string, isActive: boolean }) => {
    const Icon = icon;
    return (
        <Card className={`cursor-pointer hover:shadow-md transition-all ${isActive ? 'ring-2 ring-primary' : ''}`} onClick={onClick}>
            <CardContent className="p-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${colorClass}`}>
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
            {step === 'progress' && `Aguarde enquanto as consultas são processadas.`}
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
          {step === 'progress' && <Button variant="destructive" onClick={handleClose}>Fechar</Button>}
          {step === 'complete' && (
             <>
              <Button variant="outline" onClick={handleNewQueryClick}>Fazer nova consulta</Button>
              <div className='flex-grow' />
              {progressStats.error > 0 && <Button variant="secondary" onClick={handleRerunFailed}>Reexecutar Falhas</Button>}
              <Button onClick={handleClose}>Fechar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
