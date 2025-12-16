'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, LayoutGrid, List, MoreHorizontal } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, updateDoc, doc, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AddObligationDialog } from './add-obligation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { ObligationDetailsDialog } from './obligation-details-dialog';
import { KpiCard } from '../dashboard/kpi-card';
import { startOfMonth, endOfMonth, isWithinInterval, format, isPast, startOfDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ObligationCard } from './obligation-card';

export type ObligationStatus = 'Pendente' | 'Em Andamento' | 'Entregue' | 'Atrasada' | 'Cancelada';

export interface TaxObligation {
  id: string;
  companyId: string;
  companyName: string;
  nome: string;
  categoria: 'Fiscal' | 'Contábil' | 'DP' | 'Outros';
  periodicidade: 'Mensal' | 'Anual' | 'Eventual';
  periodo: string; // "YYYY-MM"
  dataVencimento: Timestamp | Date;
  dataEntrega?: Timestamp | Date | null;
  status: ObligationStatus;
  responsavelId?: string;
  responsavelNome?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  historico?: any[];
  comprovantes?: string[];
  displayStatus?: ObligationStatus;
}

const getStatusBadgeVariant = (status?: ObligationStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline';
  switch (status) {
    case 'Entregue': return 'default';
    case 'Atrasada': return 'destructive';
    case 'Pendente': return 'secondary';
    case 'Em Andamento': return 'secondary'; // Could be another color
    case 'Cancelada': return 'outline';
    default: return 'outline';
  }
};


export function ObligationsClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<TaxObligation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'kanban' | 'list'>('kanban');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [competenceInput, setCompetenceInput] = useState(format(new Date(), 'MM/yyyy'));
  const [statusFilter, setStatusFilter] = useState<ObligationStatus | 'Todos'>('Todos');


  const [allObligations, setAllObligations] = useState<TaxObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile } = useUser();

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: companies, isLoading: isLoadingCompanies } = useCollection<{id: string, name: string}>(companiesQuery);

  const fetchAllObligations = async () => {
    if (!firestore) return;
    if (!companies) {
        setIsLoading(false);
        setAllObligations([]);
        return;
    };
    
    setIsLoading(true);
    let collectedObligations: TaxObligation[] = [];
    try {
        const promises = companies.map(company => {
            const obligationsRef = collection(firestore, 'companies', company.id, 'taxObligations');
            return getDocs(obligationsRef);
        });

        const snapshots = await Promise.all(promises);

        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                collectedObligations.push({ id: doc.id, ...doc.data() } as TaxObligation);
            });
        });
        
        setAllObligations(collectedObligations);
    } catch (error) {
        console.error("Error fetching all obligations: ", error);
        toast({ title: "Erro ao buscar obrigações", description: "Não foi possível carregar os dados de todas as empresas.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingCompanies) {
      fetchAllObligations();
    }
  }, [isLoadingCompanies]);
  
  const forceRefetch = () => {
    if (!isLoadingCompanies) {
      fetchAllObligations();
    }
  };

  const handleAction = () => {
    forceRefetch();
    setIsDetailsDialogOpen(false);
    setIsAddDialogOpen(false);
  };
  
  const handleOpenDetails = (obligation: TaxObligation) => {
    setSelectedObligation(obligation);
    setIsDetailsDialogOpen(true);
  };

  const filteredObligations = useMemo(() => {
      if (!allObligations) return [];
      
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      const today = startOfDay(new Date());

      return allObligations
        .map(o => {
            const dueDate = o.dataVencimento instanceof Timestamp ? o.dataVencimento.toDate() : o.dataVencimento;
            const isOverdue = isPast(dueDate) && o.status === 'Pendente';
            const displayStatus: ObligationStatus = isOverdue ? 'Atrasada' : o.status;
            return { ...o, displayStatus };
        })
        .filter(o => {
            const dueDate = o.dataVencimento instanceof Timestamp ? o.dataVencimento.toDate() : o.dataVencimento;
            const isDateInMonth = isWithinInterval(dueDate, { start, end });
            const searchMatch = searchTerm === '' || 
                                o.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                o.nome.toLowerCase().includes(searchTerm.toLowerCase());
            const statusMatch = statusFilter === 'Todos' || o.displayStatus === statusFilter;
            return isDateInMonth && searchMatch && statusMatch;
        });
  }, [allObligations, searchTerm, selectedDate, statusFilter]);
  
  const kpis = useMemo(() => {
    const obligationsInMonth = allObligations.filter(o => {
      const dueDate = o.dataVencimento instanceof Timestamp ? o.dataVencimento.toDate() : o.dataVencimento;
      return isWithinInterval(dueDate, { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });
    });

    const today = startOfDay(new Date());
    const total = obligationsInMonth.length;
    const entregue = obligationsInMonth.filter(o => o.status === 'Entregue').length;
    
    const atrasada = obligationsInMonth.filter(o => {
        const dueDate = o.dataVencimento instanceof Timestamp ? o.dataVencimento.toDate() : o.dataVencimento;
        return isPast(dueDate) && o.status !== 'Entregue' && o.status !== 'Cancelada';
    }).length;

    const pendente = total - entregue - atrasada;

    return {
        total,
        entregue,
        atrasada,
        pendente,
        percentualEntregue: total > 0 ? (entregue / total) * 100 : 0,
    }
  }, [allObligations, selectedDate]);

  const handleCompetenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 6);
    }
    setCompetenceInput(value);

    if (value.length === 7) {
      const date = parse(value, 'MM/yyyy', new Date());
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    }
  };

  const handleKpiClick = (status: ObligationStatus | 'Todos') => {
    setStatusFilter(current => current === status ? 'Todos' : status);
  };

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : (date as Timestamp).toDate();
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const formatPeriod = (period: string) => {
    try {
        const [year, month] = period.split('-');
        return `${month}/${year}`;
    } catch {
        return period;
    }
  }


  return (
    <>
      {profile?.permissions.obrigacoes.create && (
        <AddObligationDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onObligationAdded={handleAction} />
      )}
      {selectedObligation && (
        <ObligationDetailsDialog key={selectedObligation.id} obligation={selectedObligation} open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} onObligationUpdated={handleAction} onObligationDeleted={handleAction} />
      )}
      
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div onClick={() => setStatusFilter('Todos')} className={statusFilter !== 'Todos' ? 'opacity-50' : ''}>
                <KpiCard title="Obrigações do Mês" value={String(kpis.total)} icon="CalendarClock" description={format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })} href="#" />
            </div>
            <div onClick={() => handleKpiClick('Entregue')} className={statusFilter !== 'Todos' && statusFilter !== 'Entregue' ? 'opacity-50' : ''}>
                <KpiCard title="Entregues" value={String(kpis.entregue)} icon="CheckCircle2" description={`${kpis.percentualEntregue.toFixed(0)}% concluído`} href="#" />
            </div>
            <div onClick={() => handleKpiClick('Pendente')} className={statusFilter !== 'Todos' && statusFilter !== 'Pendente' ? 'opacity-50' : ''}>
                <KpiCard title="Pendentes" value={String(kpis.pendente)} icon="Clock" description="Aguardando ação" href="#" />
            </div>
            <div onClick={() => handleKpiClick('Atrasada')} className={statusFilter !== 'Todos' && statusFilter !== 'Atrasada' ? 'opacity-50' : ''}>
                <KpiCard title="Atrasadas" value={String(kpis.atrasada)} icon="AlertTriangle" description="Exigem atenção imediata" href="#" />
            </div>
        </div>

        <Card>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                 <Input
                    placeholder="MM/AAAA"
                    value={competenceInput}
                    onChange={handleCompetenceChange}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full md:w-auto md:min-w-[120px]"
                    maxLength={7}
                />
                 <div className="relative w-full md:flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por obrigação ou empresa..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant={viewType === 'kanban' ? 'default' : 'outline'} size="icon" onClick={() => setViewType('kanban')}><LayoutGrid/></Button>
                    <Button variant={viewType === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewType('list')}><List/></Button>
                 </div>
                 {profile?.permissions.obrigacoes.create && (
                    <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Obrigação
                    </Button>
                 )}
            </CardContent>
        </Card>
        
        {isLoading || isLoadingCompanies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({length: 10}).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                ))}
            </div>
        ) : viewType === 'kanban' ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredObligations.length > 0 ? (
                    filteredObligations.map(ob => (
                        <ObligationCard key={ob.id} obligation={ob} onClick={() => handleOpenDetails(ob)} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-10">
                        <p className="text-muted-foreground">Nenhuma obrigação encontrada para os filtros aplicados.</p>
                    </div>
                )}
            </div>
        ) : (
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Obrigação</TableHead>
                                <TableHead>Competência</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Ações</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredObligations.length > 0 ? (
                                filteredObligations.map(ob => (
                                <TableRow key={ob.id}>
                                    <TableCell className="font-medium">{ob.companyName}</TableCell>
                                    <TableCell>{ob.nome}</TableCell>
                                    <TableCell>{formatPeriod(ob.periodo)}</TableCell>
                                    <TableCell>{formatDate(ob.dataVencimento)}</TableCell>
                                    <TableCell>{ob.responsavelNome}</TableCell>
                                    <TableCell><Badge variant={getStatusBadgeVariant(ob.displayStatus)}>{ob.displayStatus}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="icon" onClick={() => handleOpenDetails(ob)}>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Nenhuma obrigação encontrada para os filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        )}

      </div>
    </>
  );
}
