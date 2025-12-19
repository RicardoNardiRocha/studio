
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
import { MoreHorizontal, PlusCircle, Upload, Search, ShieldCheck, ShieldX, ShieldQuestion, AlertTriangle, X } from 'lucide-react';
import { AddCompanyDialog } from './add-company-dialog';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { CompanyDetailsDialog, type Company } from './company-details-dialog';
import { BulkAddCompaniesDialog } from './bulk-add-companies-dialog';
import { differenceInDays, parse, isValid, startOfDay } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

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

type CertificateStatus = 'Válido' | 'Vencendo em 60 dias' | 'Vencendo em 30 dias' | 'Vencido' | 'Não informado';

const getCertificateStatusInfo = (validity?: string): { text: string; status: CertificateStatus; variant: 'default' | 'destructive' | 'secondary' | 'warning'; daysLeft?: number, Icon: React.ElementType, dateText: string } => {
  if (!validity) {
    return { text: 'Não informado', status: 'Não informado', variant: 'secondary', Icon: ShieldQuestion, dateText: 'N/A' };
  }
  try {
    const [year, month, day] = validity.split('-').map(Number);
    const validityDate = startOfDay(new Date(year, month - 1, day));
    
     if (!isValid(validityDate)) {
        return { text: 'Data inválida', status: 'Não informado', variant: 'secondary', Icon: ShieldQuestion, dateText: 'Inválida' };
    }

    const today = startOfDay(new Date());
    const daysLeft = differenceInDays(validityDate, today);
    const dateText = validityDate.toLocaleDateString('pt-BR');

    if (daysLeft < 0) {
      return { text: 'Vencido', status: 'Vencido', variant: 'destructive', daysLeft, Icon: ShieldX, dateText };
    }
    if (daysLeft <= 30) {
      return { text: `Vence em ${daysLeft}d`, status: 'Vencendo em 30 dias', variant: 'destructive', daysLeft, Icon: ShieldCheck, dateText };
    }
    if (daysLeft <= 60) {
      return { text: `Vence em ${daysLeft}d`, status: 'Vencendo em 60 dias', variant: 'warning', daysLeft, Icon: ShieldCheck, dateText };
    }
    return { text: 'Válido', status: 'Válido', variant: 'default', daysLeft, Icon: ShieldCheck, dateText };
  } catch (e) {
    return { text: 'Data inválida', status: 'Não informado', variant: 'secondary', Icon: ShieldQuestion, dateText: 'Inválida' };
  }
};


const taxRegimes = ['Todos', 'Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Lucro Presumido / Real'];
const certificateStatuses: Array<'Todos' | CertificateStatus> = ['Todos', 'Válido', 'Vencendo em 60 dias', 'Vencendo em 30 dias', 'Vencido', 'Não informado'];
const companyStatuses = ['Todos', 'ATIVA', 'INAPTA', 'BAIXADA'];


export function CompaniesClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [taxRegimeFilter, setTaxRegimeFilter] = useState('Todos');
  const [certificateStatusFilter, setCertificateStatusFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);


  const firestore = useFirestore();
  const { profile } = useUser();

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  
  const { data: companies, isLoading, forceRefetch } = useCollection<Company>(companiesQuery);
  
  const expiringCertificates = useMemo(() => {
    if (!companies) return [];
    return companies.filter(c => {
      const statusInfo = getCertificateStatusInfo(c.certificateA1Validity);
      return statusInfo.status === 'Vencido' || statusInfo.status === 'Vencendo em 30 dias' || statusInfo.status === 'Vencendo em 60 dias';
    });
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];

    let filtered = companies;

    if (showAlertsOnly) {
      const expiringIds = new Set(expiringCertificates.map(c => c.id));
      filtered = companies.filter(c => expiringIds.has(c.id));
    }

    return filtered.filter(company => {
      const nameMatch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
      const taxRegimeMatch = taxRegimeFilter === 'Todos' || company.taxRegime === taxRegimeFilter;
      const certStatusMatch = certificateStatusFilter === 'Todos' || getCertificateStatusInfo(company.certificateA1Validity).status === certificateStatusFilter;
      const statusMatch = statusFilter === 'Todos' || company.status.toUpperCase() === statusFilter;
      return nameMatch && taxRegimeMatch && certStatusMatch && statusMatch;
    });
  }, [companies, searchTerm, taxRegimeFilter, certificateStatusFilter, statusFilter, showAlertsOnly, expiringCertificates]);


  const handleAction = () => {
    forceRefetch();
    setIsDetailsDialogOpen(false);
  };

  const handleOpenDetails = (company: Company) => {
    setSelectedCompany(company);
    setIsDetailsDialogOpen(true);
  };

  const handleAlertClick = () => {
    // Ativa o filtro de alertas e limpa outros filtros que possam conflitar
    setShowAlertsOnly(true);
    setCertificateStatusFilter('Todos'); // Garante que não haja conflito
  };

  const clearAlertFilter = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão propague para o alerta
    setShowAlertsOnly(false);
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
      <div className="mb-4">
        {!isAlertDismissed && expiringCertificates.length > 0 && (
            <div onClick={handleAlertClick} className="cursor-pointer">
                <Alert variant="destructive" className="relative">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção: Certificados Vencendo!</AlertTitle>
                <AlertDescription>
                    Você possui <strong>{expiringCertificates.length}</strong> certificados de empresa vencidos ou vencendo nos próximos 60 dias. Clique aqui para vê-los.
                </AlertDescription>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsAlertDismissed(true);
                        if (showAlertsOnly) setShowAlertsOnly(false);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                >
                    <X className="h-4 w-4" />
                </button>
                </Alert>
            </div>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
                <CardTitle className="font-headline">Cadastro de Empresas</CardTitle>
                {filteredCompanies && (
                  <Badge variant="secondary">{filteredCompanies.length}</Badge>
                )}
            </div>
            <CardDescription>
              Visualize e gerencie todas as empresas atendidas pelo escritório.
            </CardDescription>
          </div>
          {profile?.permissions.empresas.create && (
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
          )}
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
            <div className="w-full md:w-auto md:min-w-[200px]">
              <Select value={certificateStatusFilter} onValueChange={setCertificateStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por certificado..." />
                </SelectTrigger>
                <SelectContent>
                  {certificateStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="w-full md:w-auto md:min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por situação..." />
                </SelectTrigger>
                <SelectContent>
                  {companyStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status === 'Todos' ? 'Todas as Situações' : status.charAt(0) + status.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {showAlertsOnly && (
                <Button variant="ghost" onClick={clearAlertFilter}>
                    <X className="mr-2 h-4 w-4" />
                    Limpar Filtro de Alerta
                </Button>
             )}
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Regime Tributário</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Vencimento A1</TableHead>
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
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => {
                     const certStatus = getCertificateStatusInfo(company.certificateA1Validity);
                     return (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.cnpj}</TableCell>
                        <TableCell>{company.taxRegime}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
                        </TableCell>
                        <TableCell className="space-y-1">
                          <Badge variant={certStatus.variant} className="gap-1.5 whitespace-nowrap">
                            <certStatus.Icon className="h-3 w-3" />
                            {certStatus.text}
                          </Badge>
                          <div className="text-xs text-muted-foreground">{certStatus.dateText}</div>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="outline" size="icon" onClick={() => handleOpenDetails(company)}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ver Detalhes</span>
                            </Button>
                        </TableCell>
                      </TableRow>
                     )
                    })
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
