'use client';

import { useState, useEffect } from 'react';
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AddProcessDialog } from './add-process-dialog';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CorporateProcess {
  id: string;
  companyId: string;
  companyName: string;
  processType: string;
  status: string;
  startDate: { seconds: number; nanoseconds: number } | Date;
  protocolDate?: { seconds: number; nanoseconds: number } | Date | null;
}

const processStatuses = ['Em Análise', 'Em Exigência', 'Concluído', 'Cancelado', 'Aguardando Documentação'];

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Concluído':
      return 'default';
    case 'Em Exigência':
      return 'destructive';
    case 'Cancelado':
      return 'outline';
    default:
      return 'secondary';
  }
};


export function CorporateProcessesClient() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processes, setProcesses] = useState<CorporateProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchProcesses = async () => {
    if (!firestore) return;
    setIsLoading(true);
    const allProcesses: CorporateProcess[] = [];
    const companiesSnapshot = await getDocs(collection(firestore, 'companies'));

    for (const companyDoc of companiesSnapshot.docs) {
      const processesSnapshot = await getDocs(collection(firestore, `companies/${companyDoc.id}/corporateProcesses`));
      processesSnapshot.forEach(processDoc => {
        allProcesses.push({ id: processDoc.id, ...processDoc.data() } as CorporateProcess);
      });
    }

    setProcesses(allProcesses.sort((a, b) => {
        const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate.seconds * 1000);
        const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate.seconds * 1000);
        return dateB.getTime() - dateA.getTime();
    }));
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchProcesses();
  }, [firestore]);


  const handleProcessAdded = () => {
    fetchProcesses();
  };
  
  const handleStatusChange = async (processId: string, companyId: string, newStatus: string) => {
    if (!firestore) return;
    const processRef = doc(firestore, 'companies', companyId, 'corporateProcesses', processId);
    try {
        await updateDoc(processRef, { status: newStatus });
        setProcesses(prev => prev.map(p => p.id === processId ? {...p, status: newStatus} : p));
        toast({ title: "Status atualizado com sucesso!" });
    } catch (error) {
        console.error("Failed to update status:", error);
        toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <>
      <AddProcessDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onProcessAdded={handleProcessAdded}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">
              Controle de Processos Societários
            </CardTitle>
            <CardDescription>
              Gerencie aberturas, alterações e encerramentos de empresas.
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Processo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data de Protocolo</TableHead>
                <TableHead className="w-[200px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : processes.length > 0 ? (
                processes.map((process) => (
                  <TableRow key={process.id}>
                    <TableCell className="font-medium">{process.companyName}</TableCell>
                    <TableCell>{process.processType}</TableCell>
                    <TableCell>{formatDate(process.startDate)}</TableCell>
                    <TableCell>{formatDate(process.protocolDate)}</TableCell>
                    <TableCell>
                      <Select
                        value={process.status}
                        onValueChange={(newStatus) => handleStatusChange(process.id, process.companyId, newStatus)}
                      >
                        <SelectTrigger className={cn("w-full", 
                          process.status === 'Concluído' && 'bg-green-100 border-green-300 text-green-800',
                          process.status === 'Em Exigência' && 'bg-red-100 border-red-300 text-red-800',
                          process.status === 'Cancelado' && 'bg-gray-100 border-gray-300 text-gray-500',
                        )}>
                           <SelectValue asChild>
                              <Badge variant={getStatusBadgeVariant(process.status)} className="w-full justify-start font-normal">
                                {process.status}
                              </Badge>
                           </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {processStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              <Badge variant={getStatusBadgeVariant(status)} className="border-none shadow-none">{status}</Badge>
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
                    Nenhum processo societário encontrado.
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
