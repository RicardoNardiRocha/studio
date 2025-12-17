'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObligationsTable, type Obligation } from "./obligations-table";
import { FiscalFilters } from "./fiscal-filters";
import { KpiCards } from "./kpi-cards";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export function FiscalDashboard() {
  const [companyId, setCompanyId] = useState<string | null>(null);

  const firestore = useFirestore();

  // 1. Buscar todas as obrigações uma única vez
  const obligationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'obligations'), orderBy('dueDate', 'asc'));
  }, [firestore]);

  const { data: allObligations, isLoading } = useCollection<Obligation>(obligationsQuery);

  // 2. Calcular os KPIs
  const kpis = useMemo(() => {
    if (!allObligations) {
      return { total: 0, delivered: 0, pending: 0, overdue: 0 };
    }
    const delivered = allObligations.filter(ob => ob.status === 'delivered').length;
    const pending = allObligations.filter(ob => ob.status === 'pending').length;
    const overdue = allObligations.filter(ob => ob.status === 'overdue').length;
    return {
      total: allObligations.length,
      delivered,
      pending,
      overdue,
    };
  }, [allObligations]);

  // 3. Filtrar as obrigações para a tabela com base na seleção
  const filteredObligations = useMemo(() => {
    if (!allObligations) return [];
    if (!companyId) return allObligations; // Se nenhuma empresa selecionada, mostrar todas
    return allObligations.filter(ob => ob.companyId === companyId);
  }, [allObligations, companyId]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Fiscal</h1>
          <p className="text-muted-foreground">
            Visão geral e acompanhamento das obrigações fiscais.
          </p>
        </div>
      </div>

      <KpiCards kpis={kpis} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Obrigações</CardTitle>
            <FiscalFilters
              selectedCompany={companyId}
              onCompanyChange={setCompanyId}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ObligationsTable 
            obligations={filteredObligations}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
