'use client';

import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Upload, Search } from 'lucide-react';
import { AddCompanyDialog } from './add-company-dialog';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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

const taxRegimes = ['Todos', 'Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Lucro Presumido / Real'];

export function CompaniesClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [taxRegimeFilter, setTaxRegimeFilter] = useState('Todos');

  const firestore = useFirestore();

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  
  const { data: companies, isLoading } = useCollection<Company>(companiesQuery);

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    return companies.filter(company => {
      const nameMatch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
      const taxRegimeMatch = taxRegimeFilter === 'Todos' || company.taxRegime === taxRegimeFilter;
      return nameMatch && taxRegimeMatch;
    });
  }, [companies, searchTerm, taxRegimeFilter]);


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
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Cadastro Mestre de Empresas</CardTitle>
            <CardDescription>
              Visualize e gerencie todas as empresas atendidas pelo escritório.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={() => setIsBulkAddDialogOpen(true)} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Importar em Lote
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto md:min-w-[200px]">
              <Select value={taxRegimeFilter} onValueChange={setTaxRegimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por regime..." />
                </SelectTrigger>
                <SelectContent>
                  {taxRegimes.map(regime => (
                    <SelectItem key={regime} value={regime}>{regime}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border rounded-md">
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
                ) : filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
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
                      Nenhuma empresa encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
