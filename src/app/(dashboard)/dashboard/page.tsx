'use client';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ObligationsStatusChart } from '@/components/dashboard/obligations-status-chart';
import { ProcessesByTypeChart } from '@/components/dashboard/processes-by-type-chart';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { AtRiskCompaniesTable } from '@/components/dashboard/at-risk-companies';

interface Activity {
  id: string;
  description: string;
  userName: string;
  userAvatarUrl?: string;
  timestamp: Timestamp;
}


function RecentActivities() {
  const firestore = useFirestore();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activities'), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore]);

  const { data: activities, isLoading } = useCollection<Activity>(activitiesQuery);

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))
      ) : activities && activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-center">
            <Avatar className="h-9 w-9">
               <AvatarImage src={activity.userAvatarUrl} alt={activity.userName} />
               <AvatarFallback>{activity.userName?.substring(0, 2) || <User />}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{activity.description}</p>
              <p className="text-sm text-muted-foreground">{formatTimestamp(activity.timestamp)} por {activity.userName}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
      )}
    </div>
  );
}


export default function DashboardPage() {
  return (
    <>
      <AppHeader pageTitle="Dashboard" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <KpiCards />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
              <CardTitle className='font-headline'>Atividades Recentes</CardTitle>
              <CardDescription>Últimas ações realizadas no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivities />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Obrigações por Status</CardTitle>
              <CardDescription>Distribuição das obrigações por seu estado atual.</CardDescription>
            </CardHeader>
            <CardContent>
              <ObligationsStatusChart />
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Processos Societários por Tipo</CardTitle>
                <CardDescription>Volume de processos em andamento por tipo.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProcessesByTypeChart />
            </CardContent>
           </Card>
          <AtRiskCompaniesTable />
        </div>
      </main>
    </>
  );
}
