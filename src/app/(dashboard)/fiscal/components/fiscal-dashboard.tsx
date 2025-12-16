
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiscalCalendar } from "./fiscal-calendar";
import { ObligationsTable } from "./obligations-table";
import { FiscalFilters } from "./fiscal-filters";
import { KpiCards } from "./kpi-cards";

export function FiscalDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Fiscal</h1>
          <p className="text-muted-foreground">
            Visão geral e acompanhamento das obrigações fiscais.
          </p>
        </div>
        <FiscalFilters />
      </div>

      <KpiCards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendário Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <FiscalCalendar />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Obrigações</CardTitle>
          </CardHeader>
          <CardContent>
            <ObligationsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
