import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CommunicationPage() {
  return (
    <>
      <AppHeader pageTitle="Comunicação Interna" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <CardTitle className='font-headline'>Comunicação Interna</CardTitle>
            <CardDescription>Centralize a comunicação, checklists e solicitações de clientes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve: Um "Slack contábil" focado na sua operação.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
