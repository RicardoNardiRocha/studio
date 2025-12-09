'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, CalendarIcon } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TaxObligation, ObligationStatus } from './obligations-client';
import { Timestamp } from 'firebase/firestore';
import { Input } from '../ui/input';
import { logActivity } from '@/lib/activity-log';

interface ObligationDetailsDialogProps {
  obligation: TaxObligation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onObligationUpdated: () => void;
  onObligationDeleted: () => void;
}

const obligationStatuses: ObligationStatus[] = ['Pendente', 'Em Andamento', 'Entregue', 'Atrasada'];

const formSchema = z.object({
  nome: z.string().min(1, 'O nome da obrigação é obrigatório.'),
  categoria: z.enum(['Fiscal', 'Contábil', 'DP', 'Societário']),
  periodicidade: z.enum(['Mensal', 'Trimestral', 'Anual', 'Eventual']),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido. Use AAAA-MM."),
  dataVencimento: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  status: z.enum(obligationStatuses),
  responsavelId: z.string().optional(),
});


const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return new Date(date);
    return undefined;
}

type UserProfile = { uid: string; displayName: string };

export function ObligationDetailsDialog({
  obligation,
  open,
  onOpenChange,
  onObligationUpdated,
  onObligationDeleted,
}: ObligationDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const usersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users } = useCollection<UserProfile>(usersCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: obligation.nome,
      categoria: obligation.categoria,
      periodicidade: obligation.periodicidade,
      periodo: obligation.periodo,
      dataVencimento: toDate(obligation.dataVencimento),
      status: obligation.status,
      responsavelId: obligation.responsavelId || user?.uid,
    },
  });

  const handleDelete = () => {
    if (!firestore || !user) {
      toast({ title: 'Erro', description: 'O serviço de banco de dados não está disponível.', variant: 'destructive' });
      return;
    }
    const obligationRef = doc(firestore, 'taxObligations', obligation.id);
    deleteDocumentNonBlocking(obligationRef);
    logActivity(firestore, user, `excluiu a obrigação ${obligation.nome} de ${obligation.companyName}.`);
    toast({
      title: 'Obrigação Excluída',
      description: `A obrigação de ${obligation.nome} para ${obligation.companyName} foi removida.`,
    });
    onObligationDeleted();
    onOpenChange(false);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) {
      toast({ title: 'Erro', description: 'Serviço de banco de dados ou autenticação não disponível.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const obligationRef = doc(firestore, 'taxObligations', obligation.id);
      
      const responsibleUser = users?.find(u => u.uid === values.responsavelId);
      
      const updatedData = {
        ...values,
        responsavelNome: responsibleUser?.displayName || obligation.responsavelNome,
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(obligationRef, updatedData, { merge: true });
      logActivity(firestore, user, `atualizou a obrigação ${values.nome} para ${obligation.companyName}.`);

      toast({
        title: 'Obrigação Atualizada!',
        description: `Os dados da obrigação foram salvos.`,
      });
      onObligationUpdated();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao atualizar obrigação',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes da Obrigação</DialogTitle>
          <DialogDescription>
            Visualize e edite as informações para <span className='font-bold'>{obligation.companyName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
             <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Obrigação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: DAS, SPED, DEFIS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Fiscal', 'Contábil', 'DP', 'Societário'].map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodicidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodicidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Mensal', 'Trimestral', 'Anual', 'Eventual'].map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="periodo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <FormControl>
                        <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                  control={form.control}
                  name="dataVencimento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Vencimento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {obligationStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responsavelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.uid} value={user.uid}>{user.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />


            <DialogFooter className="pt-4 flex-row justify-between w-full">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá excluir permanentemente a obrigação.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="ghost">Fechar</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
          </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
