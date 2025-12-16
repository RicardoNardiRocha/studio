'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, LayoutGrid, List, CalendarDays, Filter, X } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, updateDoc, doc, orderBy, Timestamp, getDocs } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AddObligationDialog } from './add-obligation-dialog';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { ObligationDetailsDialog } from './obligation-details-dialog';
import { KpiCard } from '../dashboard/kpi-card';
import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';

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


const obligationStatuses: ObligationStatus[] = ['Pendente', 'Em Andamento', 'Entregue', 'Atrasada'];

const getStatusStyles = (status: ObligationStatus): { bg: string, text: string, border: string } => {
  switch (status) {
    case 'Pendente': return { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-500' };
    case 'Em Andamento': return { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-500' };
    case 'Entregue': return { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', border: 'border-green-500' };
    case 'Atrasada': return { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', border: 'border-red-500' };
    default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', border: 'border-gray-500' };
  }
};


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
    fetchAllObligations();
  }, [companies, isLoadingCompanies, firestore]);
  
  const forceRefetch = () => {
    fetchAllObligations();
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
  
  const kpis = useMemo(() => {
    const total = filteredObligations.length;
    const entregue = filteredObligations.filter(o => o.status === 'Entregue').length;
    const atrasada = filteredObligations.filter(o => o.status === 'Atrasada').length;
    const pendente = filteredObligations.filter(o => o.status === 'Pendente').length;

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

  const ObligationCard = ({ obligation }: { obligation: TaxObligation }) => (
    <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => handleOpenDetails(obligation)}
    >
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-bold">{obligation.nome}</CardTitle>
        <CardDescription className="text-xs">{obligation.companyName}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
        <p>Vencimento: {obligation.dataVencimento instanceof Date ? obligation.dataVencimento.toLocaleDateString() : (obligation.dataVencimento as Timestamp).toDate().toLocaleDateString()}</p>
        <p>Responsável: {obligation.responsavelNome || 'N/A'}</p>
      </CardContent>
    </Card>
  );

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
          <KpiCard title="Obrigações do Mês" value={String(kpis.total)} icon="CalendarClock" description={format(selectedDate, "MMMM 'de' yyyy", { locale: pt.BR })} href="#" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {obligationStatuses.map(status => {
              const { bg, text, border } = getStatusStyles(status);
              const obligationsInStatus = filteredObligations.filter(o => o.status === status);
              return (
                <div key={status} className={`p-4 rounded-lg h-full ${bg}`}>
                  <h3 className={`font-semibold mb-4 pb-2 border-b-2 ${border} ${text}`}>
                    {status} <Badge variant="secondary">{obligationsInStatus.length}</Badge>
                  </h3>
                  <div className="space-y-4 h-[calc(100vh-22rem)] overflow-y-auto pr-2">
                    {obligationsInStatus.length > 0 ? (
                      obligationsInStatus.map(ob => <ObligationCard key={ob.id} obligation={ob} />)
                    ) : (
                      <p className={`text-sm text-center py-8 ${text}`}>Nenhuma obrigação.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
