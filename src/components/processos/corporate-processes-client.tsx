
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, MoreHorizontal, AlertTriangle, ArrowUp, ArrowRight, ArrowDown, Workflow, Loader2, CheckCircle2, X } from 'lucide-react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, updateDoc, doc, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AddProcessDialog } from './add-process-dialog';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { ProcessDetailsDialog } from './process-details-dialog';
import { differenceInDays, isPast } from 'date-fns';

export type ProcessPriority = 'Baixa' | 'Média' | 'Alta';
export type ProcessStatus = 'Aguardando Documentação' | 'Em Análise' | 'Em Preenchimento' | 'Protocolado' | 'Em Andamento Externo' | 'Aguardando Cliente' | 'Aguardando Órgão' | 'Concluído' | 'Cancelado';

export interface CorporateProcess {
  id: string;
  companyId: string;
  companyName: string;
  processType: string;
  status: ProcessStatus;
  startDate: Timestamp | Date;
  protocolDate?: Timestamp | Date | null;
  priority: ProcessPriority;
  dueDate?: Timestamp | Date | null;
  history?: any[];
  attachments?: any[];
  notes?: string;
}

const processStatuses: ProcessStatus[] = ['Aguardando Documentação', 'Em Análise', 'Em Preenchimento', 'Protocolado', 'Em Andamento Externo', 'Aguardando Cliente', 'Aguardando Órgão', 'Concluído', 'Cancelado'];
const processTypes = ['Todos', 'Abertura', 'Alteração', 'Baixa', 'Certidão', 'Parcelamento', 'Outro'];
const processPriorities: Array<'Todos' | ProcessPriority> = ['Todos', 'Baixa', 'Média', 'Alta'];


const getStatusBadgeVariant = (status: ProcessStatus): 'success' | 'info' | 'cyan' | 'warning' | 'destructive' | 'outline' | 'secondary' => {
  switch (status) {
    case 'Concluído':
      return 'success';
    case 'Em Análise':
    case 'Protocolado':
      return 'info';
    case 'Em Preenchimento':
    case 'Em Andamento Externo':
      return 'cyan';
    case 'Aguardando Documentação':
    case 'Aguardando Cliente':
    case 'Aguardando Órgão':
      return 'warning';
    case 'Cancelado':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getPriorityIcon = (priority: ProcessPriority) => {
  switch (priority) {
    case 'Alta': return <ArrowUp className="h-4 w-4 text-destructive" />;
    case 'Média': return <ArrowRight className="h-4 w-4 text-yellow-500" />;
    case 'Baixa': return <ArrowDown className="h-4 w-4 text-green-500" />;
    default: return null;
  }
}

export function CorporateProcessesClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertCallback, setAlertCallback] = useState<{ onConfirm: () => void } | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<CorporateProcess | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | 'Todos' | 'Em Andamento'>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<'Todos' | ProcessPriority>('Todos');

  const [allProcesses, setAllProcesses] = useState<CorporateProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile } = useUser();

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: companies, isLoading: isLoadingCompanies } = useCollection<{id: string, name: string}>(companiesQuery);

  const fetchAllProcesses = async () => {
    if (!firestore || !companies || companies.length === 0) {
      setAllProcesses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let collectedProcesses: CorporateProcess[] = [];
    try {
        const promises = companies.map(company => {
            const processesRef = collection(firestore, 'companies', company.id, 'corporateProcesses');
            return getDocs(processesRef);
        });

        const snapshots = await Promise.all(promises);
        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                collectedProcesses.push({ id: doc.id, ...doc.data() } as CorporateProcess);
            });
        });
        
        collectedProcesses.sort((a, b) => ((b.startDate as Timestamp)?.toMillis() || 0) - ((a.startDate as Timestamp)?.toMillis() || 0));
        setAllProcesses(collectedProcesses);
    } catch (error) {
        console.error("Error fetching all processes: ", error);
        toast({ title: "Erro ao buscar processos", description: "Não foi possível carregar os dados de todas as empresas.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingCompanies && companies) {
        fetchAllProcesses();
    }
  }, [companies, isLoadingCompanies, firestore]);

  const forceRefetch = () => {
      if (!isLoadingCompanies && companies) {
        fetchAllProcesses();
      }
  };

  const handleProcessAction = () => {
    forceRefetch();
    setIsDetailsDialogOpen(false);
    setIsAddDialogOpen(false);
  };
  
  const handleStatusChange = async (process: CorporateProcess, newStatus: ProcessStatus) => {
    if (!firestore) return;
    
    const changeAction = async () => {
        const processRef = doc(firestore, 'companies', process.companyId, 'corporateProcesses', process.id);
        try {
            await updateDoc(processRef, { status: newStatus });
            forceRefetch();
            toast({ title: "Status atualizado com sucesso!" });
        } catch (error) {
            console.error("Failed to update status:", error);
            toast({ title: "Erro ao atualizar status", variant: "destructive" });
        }
    };

    if ((process.status === 'Concluído' || process.status === 'Cancelado') && newStatus !== process.status) {
        setAlertCallback({ onConfirm: changeAction });
        setIsAlertOpen(true);
    } else {
        changeAction();
    }
  };

  const handleOpenDetails = (process: CorporateProcess) => {
    setSelectedProcess(process);
    setIsDetailsDialogOpen(true);
  };

  const filteredProcesses = useMemo(() => {
    if (!allProcesses) return [];
    const today = new Date();
    return allProcesses.filter(p => {
        const searchMatch = p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.processType.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = typeFilter === 'Todos' || p.processType === typeFilter;
        
        let statusMatch = statusFilter === 'Todos' || p.status === statusFilter;
        if (statusFilter === 'Em Andamento') {
          statusMatch = !['Concluído', 'Cancelado'].includes(p.status);
        }
        
        const priorityMatch = priorityFilter === 'Todos' || p.priority === priorityFilter;
        
        return searchMatch && typeMatch && statusMatch && priorityMatch;
    });
  }, [allProcesses, searchTerm, typeFilter, statusFilter, priorityFilter]);

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const kpiValues = useMemo(() => {
    if (!allProcesses) return { inProgress: 0, completed: 0, delayed: 0, total: 0 };
    const today = new Date();
    const total = allProcesses.length;
    const inProgress = allProcesses.filter(p => !['Concluído', 'Cancelado'].includes(p.status)).length;
    const completed = allProcesses.filter(p => p.status === 'Concluído').length;
    const delayed = allProcesses.filter(p => p.status !== 'Concluído' && p.status !== 'Cancelado' && differenceInDays(today, (p.startDate as Timestamp).toDate()) > 30).length;
    
    return { total, inProgress, completed, delayed };
  }, [allProcesses]);
  
  const KpiCard = ({ title, value, icon, onClick, colorClass, isActive }: { title: string; value: number; icon: React.ElementType, onClick: () => void, colorClass: string, isActive: boolean }) => {
    const Icon = icon;
    return (
        <Card className={`cursor-pointer hover:shadow-md transition-all ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}`} onClick={onClick}>
            <CardContent className="p-4 flex items-center gap-4 relative">
                 <div className={`p-3 rounded-full ${colorClass}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{title}</p>
                </div>
                {isActive && (
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); setStatusFilter('Todos'); }}>
                        <X className="h-4 w-4"/>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
  };

  return (
    <>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Este processo já está marcado como finalizado. Reabri-lo irá alterar seu status. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => alertCallback?.onConfirm()}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {profile?.permissions.processos.create && (
        <AddProcessDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onProcessAdded={handleProcessAction}
        />
      )}
      {selectedProcess && (
        <ProcessDetailsDialog
          key={selectedProcess.id}
          process={selectedProcess}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onProcessUpdated={handleProcessAction}
          onProcessDeleted={handleProcessAction}
        />
      )}
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            <KpiCard title="Total de Processos" value={kpiValues.total} icon={Workflow} colorClass="bg-gray-500" onClick={() => setStatusFilter('Todos')} isActive={statusFilter === 'Todos'} />
            <KpiCard title="Em Andamento" value={kpiValues.inProgress} icon={Loader2} colorClass="bg-blue-500" onClick={() => setStatusFilter('Em Andamento')} isActive={statusFilter === 'Em Andamento'} />
            <KpiCard title="Concluídos" value={kpiValues.completed} icon={CheckCircle2} colorClass="bg-green-500" onClick={() => setStatusFilter('Concluído')} isActive={statusFilter === 'Concluído'} />
            <KpiCard title="Atrasados (>30d)" value={kpiValues.delayed} icon={AlertTriangle} colorClass="bg-red-500" onClick={() => {}} isActive={false} />
        </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="font-headline">
              Controle de Processos Societários
            </CardTitle>
            <CardDescription>
              Gerencie aberturas, alterações e encerramentos de empresas.
            </CardDescription>
          </div>
          {profile?.permissions.processos.create && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full mt-4 md:mt-0 md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Processo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-grow min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa ou tipo..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-grow min-w-[180px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Filtrar por tipo..." /></SelectTrigger>
                <SelectContent>{processTypes.map(type => (<SelectItem key={type} value={type}>{type === 'Todos' ? 'Todos os Tipos' : type}</SelectItem>))}</SelectContent>
              </Select>
            </div>
             <div className="flex-grow min-w-[180px]">
              <Select value={priorityFilter} onValueChange={(value: 'Todos' | ProcessPriority) => setPriorityFilter(value)}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por prioridade..." /></SelectTrigger>
                    <SelectContent><SelectItem value="Todos">Todas as Prioridades</SelectItem>{processPriorities.filter(p => p !== 'Todos').map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent>
                </Select>
            </div>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'></TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead className="w-[200px]">Status</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isLoadingCompanies ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProcesses.length > 0 ? (
                  filteredProcesses.map((process) => {
                     const isDelayed = process.status !== 'Concluído' && process.status !== 'Cancelado' && differenceInDays(new Date(), (process.startDate as Timestamp).toDate()) > 30;
                     const isCanceled = process.status === 'Cancelado';
                     return (
                        <TableRow key={process.id} className={isCanceled ? 'bg-slate-200 dark:bg-slate-800' : isDelayed ? 'bg-destructive/10' : ''}>
                          <TableCell>{getPriorityIcon(process.priority)}</TableCell>
                          <TableCell className="font-medium">{process.companyName}</TableCell>
                          <TableCell>{process.processType}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            Início: {formatDate(process.startDate)}<br/>
                            Protocolo: {formatDate(process.protocolDate)}
                          </TableCell>
                          <TableCell>
                            <Select value={process.status} onValueChange={(newStatus: ProcessStatus) => handleStatusChange(process, newStatus)} disabled={!profile?.permissions.processos.update}>
                              <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 border-0 shadow-none p-0 h-auto bg-transparent">
                                <SelectValue asChild>
                                    <Badge variant={getStatusBadgeVariant(process.status)} className="w-full justify-center font-medium">
                                    {process.status}
                                    </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {processStatuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <Badge variant={getStatusBadgeVariant(status)} className="border-none shadow-none font-medium">{status}</Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            {isDelayed && <AlertTriangle className="h-4 w-4 text-destructive inline-block mr-2" title="Processo atrasado"/>}
                            <Button variant="outline" size="icon" onClick={() => handleOpenDetails(process)}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ver Detalhes</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                     )
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum processo encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
