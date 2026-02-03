import { TutorialClient } from '@/components/tutorial/tutorial-client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TutorialPage() {
  return (
    <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">
            Guia de Utilização do ContabilX ERP
          </CardTitle>
          <CardDescription>
            Aprenda a usar todas as funcionalidades do sistema, passo a passo.
          </CardDescription>
        </CardHeader>
      </Card>
      <TutorialClient />
    </main>
  );
}
