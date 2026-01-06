'use client';

import { useState, useMemo } from 'react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '../ui/input';
import ReactSelect, { StylesConfig } from 'react-select';
import { logActivity } from '@/lib/activity-log';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceAdded: () => void;
}

const chargeDescriptions = ['Mensalidade', 'Abertura', 'Alteração', 'Encerramento', 'Décimo Terceiro'];

const formSchema = z.object({
  companyId: z.string({ required_error: 'Selecione uma empresa.' }),
  description: z.string({ required_error: 'Selecione uma descrição para a cobrança.' }),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  dueDate: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
});

type Company = { id: string; name: string };
type CompanyOption = { value: string; label: string; };

const selectStyles: StylesConfig<CompanyOption, false> = {
  control: (base) => ({ ...base, background: 'transparent', borderColor: 'hsl(var(--input))' }),
  menu: (base) => ({ ...base, zIndex: 100, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }),
  input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
  singleValue: (base) => ({...base, color: 'hsl(var(--foreground))'}),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected ? 'hsl(var(--primary))' : isFocused ? 'hsl(var(--accent))' : 'transparent',
    color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
    ':active': {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
    },
  }),
};


export function AddInvoiceDialog({
  open,
  onOpenChange,
  onInvoiceAdded,
}: AddInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const companiesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: companies } = useCollection<Company>(companiesCollection);

  const companyOptions = useMemo<CompanyOption[]>(() => {
    if (!companies) return [];
    return companies.map(c => ({ value: c.id, label: c.name }));
  }, [companies]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: '',
      description: 'Mensalidade',
      amount: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) {
      toast({ title: 'Erro', description: 'Serviço de banco de dados ou autenticação indisponível.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const company = companies?.find(c => c.id === values.companyId);
      if (!company) throw new Error("Empresa não encontrada.");
      
      const invoiceCollectionRef = collection(firestore, 'invoices');

      const newInvoice = {
        companyId: values.companyId,
        companyName: company.name,
        description: values.description,
        amount: values.amount,
        dueDate: values.dueDate,
        status: 'Pendente',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(invoiceCollectionRef, newInvoice);
      await updateDoc(doc(invoiceCollectionRef, docRef.id), { id: docRef.id });

      logActivity(firestore, user, `criou uma cobrança de ${values.description} (R$ ${values.amount.toFixed(2)}) para ${company.name}.`);

      toast({
        title: 'Fatura Adicionada!',
        description: `A cobrança para ${company.name} foi criada com sucesso.`,
      });

      onInvoiceAdded();
      form.reset({
        companyId: '',
        description: 'Mensalidade',
        amount: 0,
        dueDate: undefined,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro ao adicionar fatura', description: error.message || 'Ocorreu um erro inesperado.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Nova Cobrança</DialogTitle>
          <DialogDescription>
            Preencha os dados para gerar uma nova cobrança.
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
                   <FormControl>
                    <ReactSelect
                      options={companyOptions}
                      placeholder="Pesquise ou selecione a empresa"
                      noOptionsMessage={() => 'Nenhuma empresa encontrada'}
                      onChange={(option: CompanyOption | null) => field.onChange(option?.value || '')}
                      value={companyOptions.find(c => c.value === field.value)}
                      styles={selectStyles}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Descrição da Cobrança</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione o tipo de cobrança" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chargeDescriptions.map(desc => (
                        <SelectItem key={desc} value={desc}>{desc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                            <Input type="number" placeholder="Ex: 500,00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Cobrança
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
