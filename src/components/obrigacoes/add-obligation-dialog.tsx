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
import { addDoc, collection, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '../ui/input';

interface AddObligationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onObligationAdded: () => void;
}

const formSchema = z.object({
  companyId: z.string({ required_error: 'Selecione uma empresa.' }),
  nome: z.string().min(1, 'O nome da obrigação é obrigatório.'),
  categoria: z.enum(['Fiscal', 'Contábil', 'DP', 'Societário'], { required_error: 'Selecione uma categoria.' }),
  periodicidade: z.enum(['Mensal', 'Trimestral', 'Anual', 'Eventual'], { required_error: 'Selecione a periodicidade.' }),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido. Use AAAA-MM."),
  dataVencimento: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  responsavelId: z.string().optional(),
});

type Company = { id: string; name: string };
type UserProfile = { uid: string; displayName: string };

export function AddObligationDialog({
  open,
  onOpenChange,
  onObligationAdded,
}: AddObligationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const companiesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: companies } = useCollection<Company>(companiesCollection);

  const usersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users } = useCollection<UserProfile>(usersCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      responsavelId: user?.uid,
      periodo: format(new Date(), 'yyyy-MM')
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
      
      const responsibleUser = users?.find(u => u.uid === values.responsavelId);

      const obligationCollectionRef = collection(firestore, 'companies', values.companyId, 'taxObligations');

      const newObligation = {
        companyId: values.companyId,
        companyName: company.name,
        nome: values.nome,
        categoria: values.categoria,
        periodicidade: values.periodicidade,
        periodo: values.periodo,
        dataVencimento: values.dataVencimento,
        status: 'Pendente',
        responsavelId: values.responsavelId || user.uid,
        responsavelNome: responsibleUser?.displayName || user.displayName || 'Não definido',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        historico: [],
        comprovantes: []
      };
      
      const docRef = await addDoc(obligationCollectionRef, newObligation);
      await updateDoc(doc(obligationCollectionRef, docRef.id), { id: docRef.id });


      toast({
        title: 'Obrigação Adicionada!',
        description: `A obrigação de ${values.nome} para ${company.name} foi criada.`,
      });

      onObligationAdded();
      form.reset({ responsavelId: user?.uid, periodo: format(new Date(), 'yyyy-MM') });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro ao adicionar obrigação', description: error.message || 'Ocorreu um erro inesperado.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Obrigação</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova obrigação fiscal.
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {['Fiscal', 'Contábil', 'DP', 'Societário'].map((cat) => (
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
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {['Mensal', 'Trimestral', 'Anual', 'Eventual'].map((p) => (
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
                    <FormLabel>Período de Competência</FormLabel>
                    <FormControl>
                        <Input type="month" placeholder="AAAA-MM" {...field} />
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Obrigação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
