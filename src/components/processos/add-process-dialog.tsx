
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
} from '@/components/ui/dialog';
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
import { Loader2, CalendarIcon } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logActivity } from '@/lib/activity-log';

interface AddProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessAdded: () => void;
}

const processTypes = ['Abertura', 'Alteração', 'Baixa', 'Certidão', 'Parcelamento', 'Outro'];
const processStatuses: Array<'Aguardando Documentação' | 'Em Análise' | 'Em Preenchimento' | 'Protocolado' | 'Em Andamento Externo' | 'Aguardando Cliente' | 'Aguardando Órgão' | 'Em Exigência' | 'Concluído' | 'Cancelado'> = ['Aguardando Documentação', 'Em Análise', 'Em Preenchimento', 'Protocolado', 'Em Andamento Externo', 'Aguardando Cliente', 'Aguardando Órgão', 'Em Exigência', 'Concluído', 'Cancelado'];
const processPriorities: Array<'Baixa' | 'Média' | 'Alta'> = ['Baixa', 'Média', 'Alta'];


const formSchema = z.object({
  companyId: z.string({ required_error: 'Selecione uma empresa.' }),
  processType: z.string({ required_error: 'Selecione o tipo de processo.' }),
  status: z.enum(processStatuses),
  priority: z.enum(processPriorities),
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  protocolDate: z.date().optional().nullable(),
});


type Company = {
  id: string;
  name: string;
};

export function AddProcessDialog({
  open,
  onOpenChange,
  onProcessAdded,
}: AddProcessDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const companiesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: companies } = useCollection<Company>(companiesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'Aguardando Documentação',
      priority: 'Média',
      startDate: new Date(),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) {
      toast({
        title: 'Erro',
        description: 'Serviço de banco de dados ou autenticação indisponível.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    try {
      const company = companies?.find(c => c.id === values.companyId);
      if (!company) throw new Error("Empresa não encontrada.");

      const batch = writeBatch(firestore);
      const processDocRef = doc(collection(firestore, 'companies', company.id, 'corporateProcesses'));

      const newProcess = {
        id: processDocRef.id,
        companyId: values.companyId,
        companyName: company.name, 
        processType: values.processType,
        status: values.status,
        priority: values.priority,
        startDate: values.startDate,
        protocolDate: values.protocolDate || null,
        createdAt: serverTimestamp(),
        history: [],
        attachments: [],
      };
      
      batch.set(processDocRef, newProcess);
      
      const historyCollectionRef = collection(firestore, `companies/${company.id}/corporateProcesses/${processDocRef.id}/history`);
      const historyDocRef = doc(historyCollectionRef);
      batch.set(historyDocRef, {
        id: historyDocRef.id,
        timestamp: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName,
        action: `Processo criado com status "${values.status}" e prioridade "${values.priority}".`,
      });

      await batch.commit();
      
      logActivity(firestore, user, `iniciou o processo de ${values.processType} para ${company.name}.`);

      toast({
        title: 'Processo Adicionado!',
        description: `O processo de ${values.processType} para ${company.name} foi criado.`,
      });

      onProcessAdded();
      onOpenChange(false);
      form.reset({
        status: 'Aguardando Documentação',
        priority: 'Média',
        startDate: new Date(),
        companyId: undefined,
        processType: undefined,
        protocolDate: undefined,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao adicionar processo',
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
          <DialogTitle>Adicionar Novo Processo</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo processo societário.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger></FormControl><SelectContent>{companies?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent></Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="processType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Processo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent>{processTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{processPriorities.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status Inicial</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o status inicial" /></SelectTrigger></FormControl><SelectContent>{processStatuses.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="protocolDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Data do Protocolo (Opcional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                  )}
                />
            </div>
           
            <DialogFooter className="pt-4"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={isLoading}>{isLoading && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)}Salvar Processo</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
