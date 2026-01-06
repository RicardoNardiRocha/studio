'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Notifications } from '@/components/dashboard/notifications';


export default function DashboardPage() {
  const { profile } = useUser();

  return (
    <>
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <KpiCards />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
              <Notifications />
          </div>
          <div className="space-y-4">
            <QuickActions />
            {profile?.permissions.usuarios.read && (
              <Card>
                <CardHeader>
                  <CardTitle className='font-headline'>Atividades Recentes</CardTitle>
                  <CardDescription>Últimas ações realizadas no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivities />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
