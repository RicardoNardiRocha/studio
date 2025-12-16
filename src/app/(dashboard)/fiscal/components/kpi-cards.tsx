
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertCircle, CheckCircle, Clock, Package } from "lucide-react";

export function KpiCards() {
  // Mock data - replace with actual data fetching
  const kpis = {
    total: 120,
    delivered: 85,
    pending: 25,
    overdue: 10,
  };

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
