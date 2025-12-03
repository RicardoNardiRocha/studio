'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { PlusCircle, MoreHorizontal, Search } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AddObligationDialog } from './add-obligation-dialog';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { ObligationDetailsDialog } from './obligation-details-dialog';

export interface TaxObligation {
  id: string;
  companyId: string;
  companyName: string;
  type: string;
  status: 'Pendente' | 'Em Andamento' | 'Entregue' | 'Atrasada';
  dueDate: { seconds: number; nanoseconds: number } | Date;
  responsibleUserId?: string;
  responsibleUserName?: string;
}

const obligationStatuses: TaxObligation['status'][] = ['Pendente', 'Em Andamento', 'Entregue', 'Atrasada'];
const obligationTypes = ['Todos', 'DAS', 'DEFIS', 'SPED Fiscal', 'SPED Contribuições', 'ECF', 'RAIS', 'DIRF', 'Outra'];


const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Entregue':
      return 'default';
    case 'Atrasada':
      return 'destructive';
    case 'Em Andamento':
      return 'secondary';
    case 'Pendente':
    default:
      return 'outline';
  }
};


export function ObligationsClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<TaxObligation | null>(null);
  const [obligations, setObligations] = useState<TaxObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchObligations = async () => {
    if (!firestore) return;
    setIsLoading(true);
    const allObligations: TaxObligation[] = [];
    try {
      const companiesSnapshot = await getDocs(collection(firestore, 'companies'));

      for (const companyDoc of companiesSnapshot.docs) {
        const q = query(collection(firestore, `companies/${companyDoc.id}/taxObligations`), orderBy('dueDate', 'asc'));
        const obligationsSnapshot = await getDocs(q);
        obligationsSnapshot.forEach(obligationDoc => {
          allObligations.push({ id: obligationDoc.id, ...obligationDoc.data() } as TaxObligation);
        });
      }

      setObligations(allObligations);
    } catch(e) {
        console.error("Error fetching obligations: ", e);
        toast({ title: "Erro ao buscar obrigações", description: "Não foi possível carregar os dados. Verifique suas permissões.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchObligations();
  }, [firestore]);


  const handleAction = () => {
    fetchObligations();
    setIsDetailsDialogOpen(false);
  };
  
  const handleStatusChange = async (obligationId: string, companyId: string, newStatus: TaxObligation['status']) => {
    if (!firestore) return;
    const obligationRef = doc(firestore, 'companies', companyId, 'taxObligations', obligationId);
    try {
        await updateDoc(obligationRef, { status: newStatus });
        setObligations(prev => prev.map(o => o.id === obligationId ? {...o, status: newStatus} : o));
        toast({ title: "Status atualizado com sucesso!" });
    } catch (error) {
        console.error("Failed to update status:", error);
        toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const handleOpenDetails = (obligation: TaxObligation) => {
    setSelectedObligation(obligation);
    setIsDetailsDialogOpen(true);
  };

  const filteredObligations = useMemo(() => {
    return obligations.filter(o => {
        const searchMatch = o.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = typeFilter === 'Todos' || o.type === typeFilter;
        const statusMatch = statusFilter === 'Todos' || o.status === statusFilter;
        return searchMatch && typeMatch && statusMatch;
    });
  }, [obligations, searchTerm, typeFilter, statusFilter]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <>
      <AddObligationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onObligationAdded={handleAction}
      />
      {selectedObligation && (
        <ObligationDetailsDialog
          key={selectedObligation.id}
          obligation={selectedObligation}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onObligationUpdated={handleAction}
          onObligationDeleted={handleAction}
        />
      )}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="font-headline">
              Controle de Obrigações Fiscais
            </CardTitle>
            <CardDescription>
              Gerencie todas as obrigações fiscais dos seus clientes.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full mt-4 md:mt-0 md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Obrigação
          </Button>
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {obligationTypes.map(type => (
                    <SelectItem key={type} value={type}>{type === 'Todos' ? 'Todos os Tipos' : type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto md:min-w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status..." />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="Todos">Todos os Status</SelectItem>
                  {obligationStatuses.map(status => (
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
                  <TableHead>Obrigação</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-[200px]">Status</TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                       <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredObligations.length > 0 ? (
                  filteredObligations.map((obligation) => (
                    <TableRow key={obligation.id}>
                      <TableCell className="font-medium">{obligation.companyName}</TableCell>
                      <TableCell>{obligation.type}</TableCell>
                      <TableCell>{formatDate(obligation.dueDate)}</TableCell>
                      <TableCell>{obligation.responsibleUserName || 'Não definido'}</TableCell>
                      <TableCell>
                        <Select
                          value={obligation.status}
                          onValueChange={(newStatus: TaxObligation['status']) => handleStatusChange(obligation.id, obligation.companyId, newStatus)}
                        >
                          <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0 border-0 shadow-none p-0 h-auto bg-transparent">
                             <SelectValue asChild>
                                <Badge variant={getStatusBadgeVariant(obligation.status)} className="w-full justify-center font-medium">
                                  {obligation.status}
                                </Badge>
                             </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {obligationStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                <Badge variant={getStatusBadgeVariant(status)} className="border-none shadow-none font-medium">{status}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDetails(obligation)}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ver Detalhes</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma obrigação encontrada.
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
