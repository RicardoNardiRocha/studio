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
  DialogClose
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Switch } from '../ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import ReactSelect from 'react-select';
import { Badge } from '@/components/ui/badge';


export interface Partner {
  id: string;
  name: string;
  cpf: string;
  hasECPF: boolean;
  ecpfValidity?: string;
  govBrLogin?: string;
  govBrPassword?: string;
  associatedCompanies?: string[];
  otherData?: string;
}

interface PartnerDetailsDialogProps {
  partner: Partner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerUpdated: () => void;
  onPartnerDeleted: () => void;
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
  otherData: z.string().optional(),
  associatedCompanies: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});

export function PartnerDetailsDialog({
  partner,
  open,
  onOpenChange,
  onPartnerUpdated,
  onPartnerDeleted,
}: PartnerDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const companiesCollection = useMemoFirebase(() => {
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
      name: partner.name,
      cpf: partner.cpf,
      hasECPF: partner.hasECPF,
      ecpfValidity: partner.ecpfValidity ? new Date(partner.ecpfValidity + 'T00:00:00-03:00') : undefined,
      govBrLogin: partner.govBrLogin || '',
      govBrPassword: partner.govBrPassword || '',
      otherData: partner.otherData || '',
      associatedCompanies: partner.associatedCompanies?.map(c => ({ value: c, label: c })) || [],
    },
  });

  const handleDelete = () => {
     if (!firestore) {
      toast({ title: "Erro", description: "O serviço de banco de dados não está disponível.", variant: "destructive"});
      return;
    }
    const partnerRef = doc(firestore, 'partners', partner.id);
    deleteDocumentNonBlocking(partnerRef);
    toast({
      title: "Sócio Excluído",
      description: `${partner.name} foi removido(a) do sistema.`
    });
    onPartnerDeleted();
    onOpenChange(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore) {
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

      const updatedPartner = {
        ...partner, // keep existing fields
        id: partnerId,
        name: values.name,
        cpf: values.cpf,
        hasECPF: values.hasECPF,
        ecpfValidity: values.ecpfValidity
          ? values.ecpfValidity.toISOString().split('T')[0]
          : '',
        govBrLogin: values.govBrLogin || '',
        govBrPassword: values.govBrPassword || '',
        otherData: values.otherData || '',
        associatedCompanies: values.associatedCompanies?.map(c => c.value) || [],
      };

      setDocumentNonBlocking(partnerRef, updatedPartner, { merge: true });

      toast({
        title: 'Sócio Atualizado!',
        description: `Os dados de ${updatedPartner.name} foram salvos.`,
      });

      onPartnerUpdated();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao atualizar sócio',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalhes de {partner.name}</DialogTitle>
          <DialogDescription>
            Visualize e edite as informações do sócio. O CPF não pode ser alterado.
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
                    <Input {...field} disabled />
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
                  <FormLabel>Empresas Associadas</FormLabel>
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
                  <FormLabel>Login GOV.BR</FormLabel>
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
                  <FormLabel>Senha GOV.BR</FormLabel>
                   <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Não altere se não for necessário"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="otherData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outros Dados do Sócio</FormLabel>
                   <FormControl>
                    <Textarea
                      placeholder="Informações adicionais, contatos, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Empresas Associadas</h3>
              {partner.associatedCompanies && partner.associatedCompanies.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {partner.associatedCompanies.map((company, index) => (
                    <li key={index}>
                      <Badge variant="secondary">{company}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma empresa associada.</p>
              )}
            </div>

            <DialogFooter className="pt-4 bg-background sticky bottom-0 flex-row justify-between w-full">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Sócio
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá excluir permanentemente os dados do sócio <strong>{partner.name}</strong> do sistema.
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
                  <Button type="button" variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
