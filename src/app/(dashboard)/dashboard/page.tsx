'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { AlertsTable } from '@/components/dashboard/alerts-table';


export default function DashboardPage() {
  return (
    <>
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <KpiCards />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-1 lg:col-span-2 space-y-4">
              <AlertsTable />
          </div>
          <div className="col-span-1 space-y-4">
            <QuickActions />
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Atividades Recentes</CardTitle>
                <CardDescription>Últimas ações realizadas no sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivities />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
