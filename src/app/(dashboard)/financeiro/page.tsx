import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FinanceiroPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo Financeiro" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <CardTitle className='font-headline'>Financeiro</CardTitle>
            <CardDescription>Gestão de mensalidades, faturamento e controle de caixa.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve: Ferramentas completas para o controle financeiro do seu escritório.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
