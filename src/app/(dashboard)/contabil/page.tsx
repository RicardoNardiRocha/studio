import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountingPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo Contábil" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <CardTitle className='font-headline'>Contabilidade</CardTitle>
            <CardDescription>Gerencie registros, demonstrações e períodos contábeis.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve: Ferramentas completas para a rotina contábil.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
