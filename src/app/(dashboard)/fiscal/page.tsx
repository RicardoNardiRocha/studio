import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentProcessor } from '@/components/fiscal/document-processor';

export default function FiscalPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo Fiscal" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Tabs defaultValue="processing">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="processing">Processamento</TabsTrigger>
            <TabsTrigger value="books">Livros Fiscais</TabsTrigger>
            <TabsTrigger value="certificates">Certificados</TabsTrigger>
          </TabsList>
          <TabsContent value="processing">
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Processamento de Documentos com IA</CardTitle>
                <CardDescription>
                  Envie um documento (PDF/XML) para obter um resumo ou cole o texto para sugerir uma classificação.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentProcessor />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="books">
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Livros Fiscais</CardTitle>
                <CardDescription>Gerencie livros de entrada, saída, inventário e mais.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Em breve: Visualização e gerenciamento dos livros fiscais.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Certificados Digitais</CardTitle>
                <CardDescription>Controle os certificados A1 e A3 de seus clientes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Em breve: Listagem de certificados com datas de vencimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
