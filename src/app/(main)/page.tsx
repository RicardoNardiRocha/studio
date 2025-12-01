import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { kpiData, recentActivities, atRiskCompanies } from '@/lib/data';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <>
      <AppHeader pageTitle="Dashboard" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle className='font-headline'>Visão Geral</CardTitle>
              <CardDescription>Faturamento mensal do escritório.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <OverviewChart />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle className='font-headline'>Atividades Recentes</CardTitle>
              <CardDescription>Últimas ações realizadas no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9">
                       <AvatarImage src={`https://i.pravatar.cc/40?img=${index + 1}`} alt="Avatar" />
                       <AvatarFallback>{activity.person.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.company}</p>
                      <p className="text-sm text-muted-foreground">{activity.activity}</p>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">{activity.person}</div>
                  </div>
                ))}
              </div>
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
