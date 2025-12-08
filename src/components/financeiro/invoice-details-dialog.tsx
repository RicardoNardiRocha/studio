
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
import { useFirestore } from '@/firebase';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Invoice, InvoiceStatus } from './invoices-client';
import { Timestamp } from 'firebase/firestore';
import { Input } from '../ui/input';

interface InvoiceDetailsDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated: () => void;
  onInvoiceDeleted: () => void;
}

const invoiceStatuses: InvoiceStatus[] = ['Pendente', 'Paga', 'Atrasada', 'Cancelada'];

const formSchema = z.object({
  referencePeriod: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido. Use AAAA-MM."),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  paymentDate: z.date().nullable().optional(),
  status: z.enum(invoiceStatuses),
});


const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return new Date(date);
    return undefined;
}

export function InvoiceDetailsDialog({
  invoice,
  open,
  onOpenChange,
  onInvoiceUpdated,
  onInvoiceDeleted,
}: InvoiceDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referencePeriod: invoice.referencePeriod,
      amount: invoice.amount,
      dueDate: toDate(invoice.dueDate),
      paymentDate: toDate(invoice.paymentDate),
      status: invoice.status,
    },
  });

  const handleDelete = () => {
    if (!firestore) {
      toast({ title: 'Erro', description: 'O serviço de banco de dados não está disponível.', variant: 'destructive' });
      return;
    }
    const invoiceRef = doc(firestore, 'invoices', invoice.id);
    deleteDocumentNonBlocking(invoiceRef);
    toast({
      title: 'Fatura Excluída',
      description: `A fatura para ${invoice.companyName} foi removida.`,
    });
    onInvoiceDeleted();
    onOpenChange(false);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
      toast({ title: 'Erro', description: 'Serviço de banco de dados não disponível.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const invoiceRef = doc(firestore, 'invoices', invoice.id);
      
      const updatedData = {
        ...values,
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(invoiceRef, updatedData, { merge: true });

      toast({
        title: 'Fatura Atualizada!',
        description: `Os dados da fatura foram salvos.`,
      });
      onInvoiceUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao atualizar fatura',
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
          <DialogTitle>Detalhes da Fatura</DialogTitle>
          <DialogDescription>
            Visualize e edite os dados da fatura para <span className='font-bold'>{invoice.companyName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
             <FormField
              control={form.control}
              name="referencePeriod"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
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
                        {invoiceStatuses.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
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
                  name="dueDate"
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
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Pagamento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Não pago</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

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
                      Esta ação não pode ser desfeita. Isso irá excluir permanentemente a fatura.
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
