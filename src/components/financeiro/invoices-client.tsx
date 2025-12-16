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
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Search, FilePlus2 } from 'lucide-react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { AddInvoiceDialog } from './add-invoice-dialog';
import { InvoiceDetailsDialog } from './invoice-details-dialog';
import { BatchInvoiceDialog } from './batch-invoice-dialog';
import { isPast, startOfDay, parse } from 'date-fns';

export type InvoiceStatus = 'Pendente' | 'Paga' | 'Atrasada' | 'Cancelada';

export interface Invoice {
  id: string;
  companyId: string;
  companyName: string;
  referencePeriod: string; // "YYYY-MM"
  amount: number;
  dueDate: Timestamp | Date;
  paymentDate?: Timestamp | Date | null;
  status: InvoiceStatus;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

const invoiceStatuses: InvoiceStatus[] = ['Pendente', 'Paga', 'Atrasada', 'Cancelada'];

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Paga':
      return 'default';
    case 'Atrasada':
      return 'destructive';
    case 'Pendente':
      return 'secondary';
    case 'Cancelada':
    default:
      return 'outline';
  }
};


export function InvoicesClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [competenceInput, setCompetenceInput] = useState('');
  
  const firestore = useFirestore();
  const { profile } = useUser();
  const { toast } = useToast();

  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    let q = query(collection(firestore, 'invoices'), orderBy('dueDate', 'desc'));
    
    // This is not a good way to filter by competence period, a proper text search engine would be better
    // For now we will filter client side
    // if (competenceFilter) {
    //   q = query(q, where('referencePeriod', '==', competenceFilter));
    // }

    return q;
  }, [firestore]);

  const { data: invoices, isLoading, error, forceRefetch } = useCollection<Invoice>(invoicesQuery);

  const handleAction = () => {
    forceRefetch();
    setIsDetailsDialogOpen(false);
    setIsAddDialogOpen(false);
    setIsBatchDialogOpen(false);
  };

  const handleOpenDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsDialogOpen(true);
  };
  
  const handleCompetenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 6);
    }
    setCompetenceInput(value);
  };

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : (date as Timestamp).toDate();
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    const today = startOfDay(new Date());

    return invoices.map(invoice => {
      const dueDate = invoice.dueDate instanceof Timestamp ? invoice.dueDate.toDate() : invoice.dueDate;
      const isOverdue = isPast(dueDate) && invoice.status === 'Pendente';
      const displayStatus: InvoiceStatus = isOverdue ? 'Atrasada' : invoice.status;
      return { ...invoice, displayStatus };
    }).filter(i => {
        const searchMatch = i.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const effectiveStatus = i.displayStatus;
        const statusMatch = statusFilter === 'Todos' || effectiveStatus === statusFilter;

        const competenceMatch = !competenceInput || i.referencePeriod === competenceInput;

        return searchMatch && statusMatch && competenceMatch;
    });
  }, [invoices, searchTerm, statusFilter, competenceInput]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  if (!profile?.permissions.financeiro.read) {
     return null;
  }

  return (
    <>
      <AddInvoiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onInvoiceAdded={handleAction}
      />
       <BatchInvoiceDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
        onComplete={handleAction}
      />
      {selectedInvoice && (
        <InvoiceDetailsDialog
          key={selectedInvoice.id}
          invoice={selectedInvoice}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onInvoiceUpdated={handleAction}
          onInvoiceDeleted={handleAction}
        />
      )}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="font-headline">
              Gestão de Faturas e Mensalidades
            </CardTitle>
            <CardDescription>
              Controle os pagamentos de mensalidades de todos os clientes.
            </CardDescription>
          </div>
          {profile?.permissions.financeiro.create && (
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
              <Button variant="outline" onClick={() => setIsBatchDialogOpen(true)}>
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  Gerar Mensalidades
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Fatura
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome da empresa..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto md:min-w-[180px]">
              <Input
                placeholder="Filtrar por Competência (MM/AAAA)"
                value={competenceInput}
                onChange={handleCompetenceChange}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                maxLength={7}
              />
            </div>
            <div className="w-full md:w-auto md:min-w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status..." />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="Todos">Todos os Status</SelectItem>
                  {invoiceStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                       <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.companyName}</TableCell>
                      <TableCell>{invoice.referencePeriod}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.displayStatus)} className="w-full max-w-fit justify-center font-medium">
                            {invoice.displayStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDetails(invoice)}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ver Detalhes</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma fatura encontrada.
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
