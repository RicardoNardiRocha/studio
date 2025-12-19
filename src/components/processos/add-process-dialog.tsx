
'use client';

import { useState, useEffect } from 'react';
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logActivity } from '@/lib/activity-log';
import { Input } from '../ui/input';

interface AddProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessAdded: () => void;
}

const processTypes = ['Abertura', 'Alteração', 'Baixa', 'Certidão', 'Parcelamento', 'Outro'];
const processStatuses: Array<'Aguardando Documentação' | 'Em Análise' | 'Em Preenchimento' | 'Protocolado' | 'Em Andamento Externo' | 'Aguardando Cliente' | 'Aguardando Órgão' | 'Em Exigência' | 'Concluído' | 'Cancelado'> = ['Aguardando Documentação', 'Em Análise', 'Em Preenchimento', 'Protocolado', 'Em Andamento Externo', 'Aguardando Cliente', 'Aguardando Órgão', 'Em Exigência', 'Concluído', 'Cancelado'];
const processPriorities: Array<'Baixa' | 'Média' | 'Alta'> = ['Baixa', 'Média', 'Alta'];


const formSchema = z.object({
  processType: z.string({ required_error: 'Selecione o tipo de processo.' }),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
  status: z.enum(processStatuses),
  priority: z.enum(processPriorities),
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  protocolDate: z.date().optional().nullable(),
}).refine(data => {
    if (data.processType === 'Abertura') {
        return !!data.companyName && data.companyName.length > 0;
    }
    return !!data.companyId;
}, {
    message: 'Selecione uma empresa ou, para "Abertura", digite o nome da nova empresa.',
    path: ['companyId'], // A mensagem de erro será associada a este campo
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
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false)

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

  const processType = form.watch('processType');
  const isOpeningProcess = processType === 'Abertura';

  useEffect(() => {
    // Limpa o campo oposto quando o tipo de processo muda
    if (isOpeningProcess) {
        form.setValue('companyId', undefined);
    } else {
        form.setValue('companyName', undefined);
    }
  }, [isOpeningProcess, form]);


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

    const isOpening = values.processType === 'Abertura';
    let companyId: string;
    let companyName: string;

    if (isOpening) {
        if (!values.companyName) {
            toast({title: 'Erro', description: 'O nome da empresa é obrigatório para processos de abertura.', variant: 'destructive'});
            setIsLoading(false);
            return;
        }
        // Para abertura, usamos um ID temporário ou o nome da empresa como ID provisório
        companyId = 'proc_abertura_' + Date.now(); // ID único para não colidir
        companyName = values.companyName;
    } else {
        const company = companies?.find(c => c.id === values.companyId);
        if (!company) {
            toast({title: 'Erro', description: 'Empresa selecionada não encontrada.', variant: 'destructive'});
            setIsLoading(false);
            return;
        }
        companyId = company.id;
        companyName = company.name;
    }

    try {
      const batch = writeBatch(firestore);
      const processDocRef = doc(collection(firestore, 'corporateProcesses'));

      const newProcess = {
        id: processDocRef.id,
        companyId: companyId,
        companyName: companyName,
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
      
      const historyCollectionRef = collection(firestore, `corporateProcesses/${processDocRef.id}/history`);
      const historyDocRef = doc(historyCollectionRef);
      batch.set(historyDocRef, {
        id: historyDocRef.id,
        timestamp: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName,
        action: `Processo criado com status "${values.status}" e prioridade "${values.priority}".`,
      });

      await batch.commit();
      
      logActivity(firestore, user, `iniciou o processo de ${values.processType} para ${companyName}.`);

      toast({
        title: 'Processo Adicionado!',
        description: `O processo de ${values.processType} para ${companyName} foi criado.`,
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
        companyName: undefined,
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
              name="processType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Processo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent>{processTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isOpeningProcess ? (
                 <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Nova Empresa</FormLabel>
                            <FormControl>
                                <Input placeholder="Digite o nome da empresa a ser aberta" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
            ) : (
                <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Empresa</FormLabel>
                        <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                disabled={!processType}
                                className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value
                                    ? companies?.find(
                                        (company) => company.id === field.value
                                    )?.name
                                    : (!processType ? "Selecione o tipo de processo primeiro" : "Selecione a empresa")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                            <Command>
                                <CommandInput placeholder="Procurar empresa..." />
                                <CommandList>
                                <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                                <CommandGroup>
                                    {companies?.map((company) => (
                                    <CommandItem
                                        value={company.name}
                                        key={company.id}
                                        onSelect={() => {
                                        form.setValue("companyId", company.id)
                                        setCompanyPopoverOpen(false)
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            company.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                        />
                                        {company.name}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
                />
            )}
           
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
