import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { documents } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo de Documentos" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className='font-headline'>Repositório de Documentos</CardTitle>
              <CardDescription>
                Armazene e gerencie todos os documentos de clientes e internos.
              </CardDescription>
            </div>
            <Button>
              <UploadCloud className="mr-2 h-4 w-4" />
              Fazer Upload
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Empresa Vinculada</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>{doc.company}</TableCell>
                    <TableCell>{doc.expiry}</TableCell>
                    <TableCell>{doc.assignee}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
