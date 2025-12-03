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
import { PlusCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AddObligationDialog } from './add-obligation-dialog';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [obligations, setObligations] = useState<TaxObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchObligations = async () => {
    if (!firestore) return;
    setIsLoading(true);
    const allObligations: TaxObligation[] = [];
    try {
      const companiesSnapshot = await getDocs(collection(firestore, 'companies'));

      for (const companyDoc of companiesSnapshot.docs) {
        const obligationsSnapshot = await getDocs(collection(firestore, `companies/${companyDoc.id}/taxObligations`));
        obligationsSnapshot.forEach(obligationDoc => {
          allObligations.push({ id: obligationDoc.id, ...obligationDoc.data() } as TaxObligation);
        });
      }

      setObligations(allObligations.sort((a, b) => {
          const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate.seconds * 1000);
          const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate.seconds * 1000);
          return dateA.getTime() - dateB.getTime();
      }));
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


  const handleObligationAdded = () => {
    fetchObligations();
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

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <>
      <AddObligationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onObligationAdded={handleObligationAdded}
      />
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
          <Button onClick={() => setIsDialogOpen(true)} className="w-full mt-4 md:mt-0 md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Obrigação
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Obrigação</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-[200px]">Status</TableHead>
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
                    </TableRow>
                  ))
                ) : obligations.length > 0 ? (
                  obligations.map((obligation) => (
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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
