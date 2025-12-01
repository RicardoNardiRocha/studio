import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PersonalDeptPage() {
  return (
    <>
      <AppHeader pageTitle="Departamento Pessoal" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <CardTitle className='font-headline'>Departamento Pessoal</CardTitle>
            <CardDescription>Controle admissões, demissões, folha de pagamento e eSocial.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Em breve: Gestão completa de rotinas trabalhistas.</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
