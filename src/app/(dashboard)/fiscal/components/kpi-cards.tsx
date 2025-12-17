
import { KpiCard, KpiCardSkeleton } from "@/components/dashboard/kpi-card";
import { AlertCircle, CheckCircle, Clock, Package } from "lucide-react";

interface KpiCardsProps {
  kpis: {
    total: number;
    delivered: number;
    pending: number;
    overdue: number;
  };
  isLoading: boolean;
}

export function KpiCards({ kpis, isLoading }: KpiCardsProps) {

  if (isLoading) {
    return (
       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      <KpiCard 
        title="Total de Obrigações" 
        value={String(kpis.total)} 
        icon={Package}
        description="Número total de obrigações fiscais cadastradas."
        href="/fiscal"
      />
      <KpiCard 
        title="Entregues" 
        value={String(kpis.delivered)}
        icon={CheckCircle}
        description="Obrigações que já foram entregues com sucesso."
        href="/fiscal?status=delivered"
      />
      <KpiCard 
        title="Pendentes" 
        value={String(kpis.pending)}
        icon={Clock}
        description="Obrigações que ainda não foram entregues."
        href="/fiscal?status=pending"
      />
      <KpiCard 
        title="Atrasadas" 
        value={String(kpis.overdue)}
        icon={AlertCircle}
        description="Obrigações que estão com o prazo de entrega vencido."
        href="/fiscal?status=overdue"
      />
    </div>
  );
}
