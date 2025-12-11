'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactSelect from 'react-select';
import { logActivity } from '@/lib/activity-log';

interface AddPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerAdded: () => void;
}

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  cpf: z.string().refine((cpf) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf), {
    message: 'CPF inválido. Use o formato 000.000.000-00.',
  }),
  hasECPF: z.boolean().default(false),
  ecpfValidity: z.date().optional(),
  govBrLogin: z.string().optional(),
  govBrPassword: z.string().optional(),
  associatedCompanies: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});

type CompanyOption = {
  value: string;
  label: string;
}

export function AddPartnerDialog({
  open,
  onOpenChange,
  onPartnerAdded,
}: AddPartnerDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const companiesCollection = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: companies } = useCollection<{id: string; name: string;}>(companiesCollection);
  
  const companyOptions = useMemo(() => {
    return companies?.map(c => ({ value: c.name, label: c.name })) || [];
  }, [companies]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cpf: '',
      hasECPF: false,
      associatedCompanies: [],
      govBrLogin: '',
      govBrPassword: '',
      ecpfValidity: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) {
      toast({
        title: 'Erro',
        description: 'O serviço de banco de dados não está disponível.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    try {
      const partnerId = values.cpf.replace(/[^\d]/g, '');
      const partnerRef = doc(firestore, 'partners', partnerId);

      const newPartner = {
        id: partnerId,
        name: values.name,
        cpf: values.cpf,
        hasECPF: values.hasECPF,
        ecpfValidity: values.ecpfValidity
          ? values.ecpfValidity.toISOString().split('T')[0]
          : '',
        govBrLogin: values.govBrLogin || '',
        govBrPassword: values.govBrPassword || '',
        associatedCompanies: values.associatedCompanies?.map(c => c.value) || [],
      };

      setDocumentNonBlocking(partnerRef, newPartner, { merge: true });
      logActivity(firestore, user, `cadastrou o novo sócio ${values.name}.`);

      toast({
        title: 'Sócio Adicionado!',
        description: `${newPartner.name} foi adicionado(a) com sucesso.`,
      });

      onPartnerAdded();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao adicionar sócio',
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
          <DialogTitle>Adicionar Novo Sócio</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo sócio ou administrador.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do sócio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="associatedCompanies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vincular a Empresas (Opcional)</FormLabel>
                  <FormControl>
                     <ReactSelect
                        {...field}
                        isMulti
                        options={companyOptions}
                        placeholder="Selecione as empresas..."
                        noOptionsMessage={() => 'Nenhuma empresa encontrada'}
                        styles={{
                          control: (base) => ({ ...base, background: 'transparent', borderColor: 'hsl(var(--input))' }),
                          menu: (base) => ({ ...base, zIndex: 100 }),
                          input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                          multiValue: (base) => ({ ...base, backgroundColor: 'hsl(var(--secondary))' }),
                        }}
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasECPF"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Possui E-CPF Ativo?</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch('hasECPF') && (
              <FormField
                control={form.control}
                name="ecpfValidity"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Validade do E-CPF</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             <FormField
              control={form.control}
              name="govBrLogin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Login GOV.BR (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Login do portal GOV.BR" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="govBrPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha GOV.BR (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Senha do portal GOV.BR" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 sticky bottom-0 bg-background py-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Sócio
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
