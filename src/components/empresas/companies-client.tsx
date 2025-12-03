'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Upload } from 'lucide-react';
import { AddCompanyDialog } from './add-company-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { CompanyDetailsDialog, type Company } from './company-details-dialog';
import { BulkAddCompaniesDialog } from './bulk-add-companies-dialog';

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined => {
  if (!status) return 'secondary';
  switch (status.toLowerCase()) {
    case 'ativa': return 'default';
    case 'apto': return 'default';
    case 'inapta': return 'destructive';
    case 'baixada': return 'outline';
    default: return 'secondary';
  }
};

export function CompaniesClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const firestore = useFirestore();

  const companiesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'companies');
  }, [firestore]);
  
  const { data: companies, isLoading } = useCollection<Company>(companiesCollection);

  const handleAction = () => {
    // a lista será atualizada automaticamente pelo useCollection
  };

  const handleOpenDetails = (company: Company) => {
    setSelectedCompany(company);
    setIsDetailsDialogOpen(true);
  };

  return (
    <>
      <AddCompanyDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCompanyAdded={handleAction}
      />
      <BulkAddCompaniesDialog
        open={isBulkAddDialogOpen}
        onOpenChange={setIsBulkAddDialogOpen}
        onImportCompleted={handleAction}
      />
      {selectedCompany && (
         <CompanyDetailsDialog
          key={selectedCompany.id}
          company={selectedCompany}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onCompanyUpdated={handleAction}
          onCompanyDeleted={handleAction}
        />
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Cadastro Mestre de Empresas</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as empresas atendidas pelo escritório.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkAddDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar em Lote
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Regime Tributário</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : companies && companies.length > 0 ? (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.cnpj}</TableCell>
                    <TableCell>{company.taxRegime}</TableCell>
                    <TableCell>{company.startDate}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="outline" size="icon" onClick={() => handleOpenDetails(company)}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ver Detalhes</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma empresa encontrada. Adicione uma para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
