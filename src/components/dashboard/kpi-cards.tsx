'use client';

import { KpiCard } from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingObligations } from '@/hooks/use-pending-obligations';
import { useActiveCompanies } from '@/hooks/use-active-companies';
import { useInProgressProcesses } from '@/hooks/use-in-progress-processes';
import { useFinancialsSummary } from '@/hooks/use-financials-summary';
import { useFiscalSummary } from '@/hooks/use-fiscal-summary';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUser } from '@/firebase';

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function KpiCards() {
  const { profile } = useUser();
  const { count: activeCompanies, isLoading: isLoadingCompanies } = useActiveCompanies();
  const { count: pendingObligations, isLoading: isLoadingObligations } = usePendingObligations();
  const { count: inProgressProcesses, isLoading: isLoadingProcesses } = useInProgressProcesses();
  const { receivedAmount, isLoading: isLoadingFinancials } = useFinancialsSummary();
  const { dasSent, dasPending, isLoading: isLoadingFiscal } = useFiscalSummary();

  const prevMonthName = format(subMonths(new Date(), 1), 'MMMM', { locale: ptBR });
  const currentMonthName = format(new Date(), 'MMMM', { locale: ptBR });


  const kpis = [
     {
      id: 'activeCompanies',
      title: 'Empresas Ativas',
      value: activeCompanies,
      icon: 'Building',
      description: 'Clientes com status "Ativa"',
      isLoading: isLoadingCompanies,
      href: '/empresas'
    },
    {
      id: 'pendingObligations',
      title: 'Obrigações Pendentes',
      value: pendingObligations,
      icon: 'CalendarClock',
      description: 'Status "Pendente" ou "Atrasada"',
      isLoading: isLoadingObligations,
      href: '/obrigacoes'
    },
    {
      id: 'inProgressProcesses',
      title: 'Processos em Andamento',
      value: inProgressProcesses,
      icon: 'Workflow',
      description: 'Processos societários ativos',
      isLoading: isLoadingProcesses,
      href: '/processos'
    },
     {
      id: 'receivedAmount',
      title: 'Recebimentos do Mês',
      value: formatCurrency(receivedAmount),
      icon: 'Landmark',
      description: `Faturas pagas em ${currentMonthName}`,
      isLoading: isLoadingFinancials,
      href: '/financeiro',
      permission: 'financeiro'
    },
    {
      id: 'dasSent',
      title: 'DAS Enviados',
      value: dasSent,
      icon: 'CheckCircle2',
      description: `Competência: ${prevMonthName}`,
      isLoading: isLoadingFiscal,
      href: '/fiscal'
    },
    {
      id: 'dasPending',
      title: 'DAS Pendentes',
      value: dasPending,
      icon: 'AlertTriangle',
      description: `Competência: ${prevMonthName}`,
      isLoading: isLoadingFiscal,
      href: '/fiscal'
    },
  ];

  const canShow = (permissionKey?: string) => {
    if (!permissionKey) return true;
    return profile?.permissions[permissionKey as keyof typeof profile.permissions]?.read === true;
  }

  return (
    <>
      {kpis.filter(kpi => canShow(kpi.permission)).map((kpi) =>
        kpi.isLoading ? (
          <CardSkeleton key={kpi.id} />
        ) : (
          <KpiCard
            key={kpi.id}
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
