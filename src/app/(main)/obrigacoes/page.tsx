import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ObligationsTable } from '@/components/obrigacoes/obligations-table';

export default function ObligationsPage() {
  return (
    <>
      <AppHeader pageTitle="Obrigações Gerais" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <CardTitle className='font-headline'>Painel de Controle de Obrigações</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as obrigações do escritório em um único lugar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ObligationsTable />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
