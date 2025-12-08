'use client';

import { KpiCard } from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingObligations } from '@/hooks/use-pending-obligations';
import { useExpiringCertificates } from '@/hooks/use-expiring-certificates';
import { useOnHoldProcesses } from '@/hooks/use-on-hold-processes';

export function KpiCards() {
  const { count: pendingObligations, isLoading: isLoadingObligations } = usePendingObligations();
  const { count: expiringCertificates, isLoading: isLoadingCertificates } = useExpiringCertificates();
  const { count: onHoldProcesses, isLoading: isLoadingProcesses } = useOnHoldProcesses();

  const kpis = [
    {
      title: 'Obrigações Pendentes',
      value: pendingObligations,
      icon: 'CalendarClock',
      description: 'Status "Pendente" ou "Atrasada"',
      isLoading: isLoadingObligations,
      href: '/obrigacoes'
    },
    {
      title: 'Certificados Vencendo',
      value: expiringCertificates,
      icon: 'FileWarning',
      description: 'nos próximos 30 dias',
      isLoading: isLoadingCertificates,
      href: '/societario'
    },
    {
      title: 'Processos em Exigência',
      value: onHoldProcesses,
      icon: 'AlertTriangle',
      description: 'aguardando ação',
      isLoading: isLoadingProcesses,
      href: '/processos'
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
