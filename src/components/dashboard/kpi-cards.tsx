'use client';

import { KpiCard } from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingObligations } from '@/hooks/use-pending-obligations';
import { useActiveCompanies } from '@/hooks/use-active-companies';
import { useInProgressProcesses } from '@/hooks/use-in-progress-processes';
import { useFinancialsSummary } from '@/hooks/use-financials-summary';
import { format } from 'date-fns';

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function KpiCards() {
  const { count: activeCompanies, isLoading: isLoadingCompanies } = useActiveCompanies();
  const { count: pendingObligations, isLoading: isLoadingObligations } = usePendingObligations();
  const { count: inProgressProcesses, isLoading: isLoadingProcesses } = useInProgressProcesses();
  const { receivedAmount, isLoading: isLoadingFinancials } = useFinancialsSummary();

  const kpis = [
     {
      title: 'Empresas Ativas',
      value: activeCompanies,
      icon: 'Building',
      description: 'Clientes com status "Ativa"',
      isLoading: isLoadingCompanies,
      href: '/empresas'
    },
    {
      title: 'Obrigações Pendentes',
      value: pendingObligations,
      icon: 'CalendarClock',
      description: 'Status "Pendente" ou "Atrasada"',
      isLoading: isLoadingObligations,
      href: '/obrigacoes'
    },
    {
      title: 'Processos em Andamento',
      value: inProgressProcesses,
      icon: 'Workflow',
      description: 'Processos societários ativos',
      isLoading: isLoadingProcesses,
      href: '/processos'
    },
     {
      title: 'Recebimentos do Mês',
      value: formatCurrency(receivedAmount),
      icon: 'Landmark',
      description: `Faturas pagas em ${format(new Date(), 'MMMM')}`,
      isLoading: isLoadingFinancials,
      href: '/financeiro'
    },
  ];

  return (
    <>
      {kpis.map((kpi) =>
        kpi.isLoading ? (
          <CardSkeleton key={kpi.title} />
        ) : (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={String(kpi.value)}
            icon={kpi.icon as any}
            description={kpi.description}
            href={kpi.href}
          />
        )
      )}
    </>
  );
}

const CardSkeleton = () => (
    <div className="p-6 border rounded-lg shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
        </div>
        <div className='space-y-2'>
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-40" />
        </div>
    </div>
)
