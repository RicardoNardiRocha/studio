'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, LayoutGrid, List, CalendarDays, Filter, X } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, updateDoc, doc, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AddObligationDialog } from './add-obligation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { ObligationDetailsDialog } from './obligation-details-dialog';
import { KpiCard } from '../dashboard/kpi-card';
import { startOfMonth, endOfMonth, isWithinInterval, format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ObligationCard, type ObligationGroup } from './obligation-card';

export type ObligationStatus = 'Pendente' | 'Em Andamento' | 'Entregue' | 'Atrasada';

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
}


export function ObligationsClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<TaxObligation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    if (!firestore || isLoadingCompanies) return;
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
    if (!isLoadingCompanies && companies) {
      fetchAllObligations();
    }
  }, [companies, isLoadingCompanies]);
  
  const forceRefetch = () => {
    if (!isLoadingCompanies && companies) {
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

      return allObligations.filter(o => {
        const dueDate = o.dataVencimento instanceof Timestamp ? o.dataVencimento.toDate() : o.dataVencimento;
        const isDateInMonth = isWithinInterval(dueDate, { start, end });
        const searchMatch = searchTerm === '' || 
                            o.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            o.nome.toLowerCase().includes(searchTerm.toLowerCase());
        return isDateInMonth && searchMatch;
    });
  }, [allObligations, searchTerm, selectedDate]);
  
  const groupedObligations = useMemo(() => {
    const groups: { [key: string]: ObligationGroup } = {};
    const today = new Date();

    filteredObligations.forEach(ob => {
        const dueDate = ob.dataVencimento instanceof Timestamp ? ob.dataVencimento.toDate() : ob.dataVencimento;
        const isOverdue = isPast(dueDate) && ob.status === 'Pendente';
        const effectiveStatus: ObligationStatus = isOverdue ? 'Atrasada' : ob.status;

        if (!groups[ob.nome]) {
            groups[ob.nome] = {
                name: ob.nome,
                dueDate: dueDate,
                total: 0,
                entregue: 0,
                pendente: 0,
                atrasada: 0,
                em_andamento: 0,
                status: 'Pendente',
            };
        }
        
        const group = groups[ob.nome];
        group.total++;
        if (effectiveStatus === 'Entregue') group.entregue++;
        else if (effectiveStatus === 'Pendente') group.pendente++;
        else if (effectiveStatus === 'Atrasada') group.atrasada++;
        else if (effectiveStatus === 'Em Andamento') group.em_andamento++;
    });

    // Determine overall status for each group
    Object.values(groups).forEach(group => {
        if (group.atrasada > 0) {
            group.status = 'Atrasada';
        } else if (group.pendente > 0 || group.em_andamento > 0) {
            group.status = 'Pendente';
        } else if (group.total > 0 && group.entregue === group.total) {
            group.status = 'Entregue';
        }
    });

    return Object.values(groups).sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());
}, [filteredObligations]);

  const kpis = useMemo(() => {
    const total = filteredObligations.length;
    const entregue = filteredObligations.filter(o => o.status === 'Entregue').length;
    const atrasada = filteredObligations.filter(o => {
        const dueDate = o.dataVencimento instanceof Timestamp ? o.dataVencimento.toDate() : o.dataVencimento;
        return isPast(dueDate) && o.status === 'Pendente';
    }).length;
    const pendente = total - entregue - atrasada;

    return {
        total,
        entregue,
        atrasada,
        pendente,
        percentualEntregue: total > 0 ? (entregue / total) * 100 : 0,
    }
  }, [filteredObligations]);


  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split('-').map(Number);
    setSelectedDate(new Date(year, month - 1, 15)); // Use mid-month to avoid timezone issues
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
        {/* KPI Header */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Obrigações do Mês" value={String(kpis.total)} icon="CalendarClock" description={format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })} href="#" />
          <KpiCard title="Entregues" value={String(kpis.entregue)} icon="CheckCircle2" description={`${kpis.percentualEntregue.toFixed(0)}% concluído`} href="#" />
          <KpiCard title="Pendentes" value={String(kpis.pendente)} icon="Clock" description="Aguardando ação" href="#" />
          <KpiCard title="Atrasadas" value={String(kpis.atrasada)} icon="AlertTriangle" description="Exigem atenção imediata" href="#" />
        </div>

        {/* Filter and Actions Bar */}
        <Card>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                 <Input
                    type="month"
                    value={format(selectedDate, 'yyyy-MM')}
                    onChange={handleDateChange}
                    className="w-full md:w-auto"
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
                    <Button variant={viewType === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewType('list')} disabled><List/></Button>
                    <Button variant={viewType === 'calendar' ? 'default' : 'outline'} size="icon" onClick={() => setViewType('calendar')} disabled><CalendarDays/></Button>
                 </div>
                 {profile?.permissions.obrigacoes.create && (
                    <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Obrigação
                    </Button>
                 )}
            </CardContent>
        </Card>
        
        {/* Main Content Area */}
        {isLoading || isLoadingCompanies ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({length: 10}).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                ))}
            </div>
        ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {groupedObligations.length > 0 ? (
                    groupedObligations.map(group => (
                        <ObligationCard key={group.name} group={group} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-10">
                        <p className="text-muted-foreground">Nenhuma obrigação encontrada para o mês selecionado.</p>
                    </div>
                )}
            </div>
        )}

      </div>
    </>
  );
}
