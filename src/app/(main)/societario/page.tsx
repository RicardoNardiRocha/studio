import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { corporateProcesses } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const getStatusVariant = (status: string) => {
    switch(status) {
        case 'Em análise': return 'secondary';
        case 'Em exigência': return 'destructive';
        case 'Concluído': return 'default';
        default: return 'outline';
    }
}

export default function CorporatePage() {
  return (
    <>
      <AppHeader pageTitle="Módulo Societário" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-headline font-bold">Processos Societários</h1>
                <p className="text-muted-foreground">Gerencie aberturas, alterações e encerramentos de empresas.</p>
            </div>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Processo
            </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {corporateProcesses.map((process, index) => (
                <Card key={index}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base font-semibold">{process.type}</CardTitle>
                                <CardDescription>{process.company}</CardDescription>
                            </div>
                            <Badge variant={getStatusVariant(process.status)}>{process.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Fase Atual:</span>
                            <span className="font-medium">{process.stage}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Responsável:</span>
                            <span className="font-medium">{process.assignee}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Data Início:</span>
                            <span className="font-medium">{process.date}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

      </main>
    </>
  );
}
