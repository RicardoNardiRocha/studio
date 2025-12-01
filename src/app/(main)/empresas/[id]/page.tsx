
import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { companies } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    switch(status) {
        case 'Apto': return 'default';
        case 'Inapto': return 'destructive';
        case 'Baixado': return 'outline';
        default: return 'secondary';
    }
}


export default function CompanyDetailsPage({ params }: { params: { id: string } }) {
  const company = companies.find((c) => c.cnpj === params.id);

  if (!company) {
    notFound();
  }

  return (
    <>
      <AppHeader pageTitle={`Detalhes da Empresa: ${company.name}`} />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className='font-headline'>{company.name}</CardTitle>
                    <CardDescription>{company.cnpj}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <Label>Regime Tributário</Label>
                    <p className="text-sm font-medium">{company.taxRegime}</p>
                </div>
                <div>
                    <Label>Data de Início das Atividades</Label>
                    <p className="text-sm font-medium">{company.startDate}</p>
                </div>
            </div>
            
            <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium font-headline">Informações Adicionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="employee-count">Número de Funcionários</Label>
                        <Input id="employee-count" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pro-labore">Valor do Pró-labore (R$)</Label>
                        <Input id="pro-labore" type="number" placeholder="0,00" />
                    </div>
                </div>
                 <Button>Salvar Informações</Button>
            </div>

          </CardContent>
        </Card>
      </main>
    </>
  );
}
