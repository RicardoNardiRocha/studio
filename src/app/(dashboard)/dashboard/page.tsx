'use client';
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { kpiData, atRiskCompanies } from '@/lib/data';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
          {kpiData.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className='font-headline'>Atividades Recentes</CardTitle>
              <CardDescription>Últimas ações realizadas no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivities />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className='font-headline'>Empresas em Risco</CardTitle>
            <CardDescription>Empresas que necessitam de atenção imediata.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden sm:table-cell">CNPJ</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Situação Cadastral</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atRiskCompanies.map((company, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{company.company}</TableCell>
                    <TableCell className="hidden sm:table-cell">{company.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="whitespace-nowrap">{company.risk}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.status === 'Apto' ? 'secondary' : 'outline'}>
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
