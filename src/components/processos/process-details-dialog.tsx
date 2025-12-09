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
import { useFirestore, useUser } from '@/firebase';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CorporateProcess } from './corporate-processes-client';
import { logActivity } from '@/lib/activity-log';

interface ProcessDetailsDialogProps {
  process: CorporateProcess;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessUpdated: () => void;
  onProcessDeleted: () => void;
}

const processTypes = ['Abertura', 'Alteração', 'Encerramento', 'Outro'];
const processStatuses: Array<'Aguardando Documentação' | 'Em Análise' | 'Em Exigência' | 'Concluído' | 'Cancelado'> = ['Aguardando Documentação', 'Em Análise', 'Em Exigência', 'Concluído', 'Cancelado'];

const formSchema = z.object({
  processType: z.string({ required_error: 'O tipo do processo é obrigatório.' }),
  status: z.enum(processStatuses),
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  protocolDate: z.date().nullable().optional(),
});


const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date.seconds) return new Date(date.seconds * 1000);
    if (typeof date === 'string') return parseISO(date);
    return undefined;
}


export function ProcessDetailsDialog({
  process,
  open,
  onOpenChange,
  onProcessUpdated,
  onProcessDeleted,
}: ProcessDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      processType: process.processType,
      status: process.status,
      startDate: toDate(process.startDate),
      protocolDate: toDate(process.protocolDate),
    },
  });

  const handleDelete = () => {
    if (!firestore || !user) {
      toast({ title: 'Erro', description: 'O serviço de banco de dados não está disponível.', variant: 'destructive' });
      return;
    }
    const processRef = doc(firestore, 'corporateProcesses', process.id);
    deleteDocumentNonBlocking(processRef);
    logActivity(firestore, user, `excluiu o processo de ${process.processType} de ${process.companyName}.`);
    toast({
      title: 'Processo Excluído',
      description: `O processo de ${process.processType} para ${process.companyName} foi removido.`,
    });
    onProcessDeleted();
    onOpenChange(false);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) {
      toast({ title: 'Erro', description: 'Serviço de banco de dados ou autenticação não disponível.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const processRef = doc(firestore, 'corporateProcesses', process.id);
      
      const updatedData = {
        processType: values.processType,
        status: values.status,
        startDate: values.startDate,
        protocolDate: values.protocolDate,
      };

      setDocumentNonBlocking(processRef, updatedData, { merge: true });
      logActivity(firestore, user, `atualizou o processo de ${values.processType} de ${process.companyName} para o status ${values.status}.`);

      toast({
        title: 'Processo Atualizado!',
        description: `Os dados do processo foram salvos.`,
      });
      onProcessUpdated();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao atualizar processo',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Processo</DialogTitle>
          <DialogDescription>
            Visualize e edite as informações do processo para <span className='font-bold'>{process.companyName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="processType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Processo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {processTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {processStatuses.map((status) => (
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
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Início</FormLabel>
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
              name="protocolDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Protocolo (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Nenhuma</span>}
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
                      Esta ação não pode ser desfeita. Isso irá excluir permanentemente o processo.
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
