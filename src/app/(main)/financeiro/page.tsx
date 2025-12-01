import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FinancialPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo Financeiro" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Tabs defaultValue="internal">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="internal">Financeiro Interno</TabsTrigger>
            <TabsTrigger value="clients">Financeiro dos Clientes</TabsTrigger>
          </TabsList>
          <TabsContent value="internal">
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Financeiro do Escritório</CardTitle>
                <CardDescription>Gerencie contas a pagar, a receber, fluxo de caixa e faturamento.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Em breve: Dashboards e ferramentas para gestão financeira interna.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Dados Financeiros dos Clientes</CardTitle>
                <CardDescription>Registre pró-labores, distribuição de lucros e outras movimentações relevantes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Em breve: Formulários para importação e registro de dados financeiros dos clientes.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
