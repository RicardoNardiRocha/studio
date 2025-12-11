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
import { Loader2, CalendarIcon, Upload } from 'lucide-react';
import { useFirestore, useCollection, useUser, useStorage } from '@/firebase';
import { addDoc, collection, doc, updateDoc, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AddObligationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onObligationAdded: () => void;
}

const formSchema = z.object({
  companyId: z.string({ required_error: 'Selecione uma empresa.' }),
  nome: z.string().min(1, 'O nome da obrigação é obrigatório.'),
  categoria: z.enum(['Fiscal', 'Contábil', 'DP', 'Outros'], { required_error: 'Selecione uma categoria.' }),
  periodicidade: z.enum(['Mensal', 'Anual', 'Eventual'], { required_error: 'Selecione a periodicidade.' }),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido. Use AAAA-MM."),
  dataVencimento: z.date({ required_error: 'A data de vencimento é obrigatória.' }),
  responsavelId: z.string().optional(),
  description: z.string().optional(),
  attachment: z.instanceof(File).optional().nullable(),
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
  const storage = useStorage();
  const { user } = useUser();

  const companiesCollection = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: companies } = useCollection<Company>(companiesCollection);

  const usersCollection = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users } = useCollection<UserProfile>(usersCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: '',
      nome: '',
      periodo: format(new Date(), 'yyyy-MM'),
      responsavelId: user?.uid || '',
      description: '',
      attachment: null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user || !storage) {
      toast({ title: 'Erro', description: 'Serviços indisponíveis.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const company = companies?.find(c => c.id === values.companyId);
      if (!company) throw new Error("Empresa não encontrada.");
      
      const responsibleUser = users?.find(u => u.uid === values.responsavelId);
      const batch = writeBatch(firestore);

      const obligationCollectionRef = collection(firestore, 'taxObligations');
      const obligationDocRef = doc(obligationCollectionRef);
      
      const newObligation = {
        id: obligationDocRef.id,
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
        description: values.description || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(obligationDocRef, newObligation);

      const historyCollectionRef = collection(firestore, `taxObligations/${obligationDocRef.id}/history`);
      const historyDocRef = doc(historyCollectionRef);
      batch.set(historyDocRef, {
        id: historyDocRef.id,
        timestamp: serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        action: `Obrigação criada com status "Pendente".`,
      });

      if (values.attachment) {
        const file = values.attachment;
        const filePath = `obligations/${obligationDocRef.id}/${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        const attachmentCollectionRef = collection(firestore, `taxObligations/${obligationDocRef.id}/attachments`);
        const attachmentDocRef = doc(attachmentCollectionRef);
        batch.set(attachmentDocRef, {
          id: attachmentDocRef.id,
          name: file.name,
          url: fileUrl,
          uploadedAt: serverTimestamp(),
          uploadedBy: user.displayName || 'Usuário',
        });
      }
      
      await batch.commit();

      toast({
        title: 'Obrigação Adicionada!',
        description: `A obrigação de ${values.nome} para ${company.name} foi criada.`,
      });

      onObligationAdded();
      form.reset({
        companyId: '',
        nome: '',
        periodo: format(new Date(), 'yyyy-MM'),
        responsavelId: user?.uid || '',
        description: '',
        attachment: null,
      });
      onOpenChange(false);
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
                        {['Fiscal', 'Contábil', 'DP', 'Outros'].map((cat) => (
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
                        {['Mensal', 'Anual', 'Eventual'].map((p) => (
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes sobre a obrigação, links úteis, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             <FormField
                control={form.control}
                name="attachment"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                    <FormLabel>Anexo de Referência (Opcional)</FormLabel>
                    <FormControl>
                        <Input type="file" onChange={e => onChange(e.target.files ? e.target.files[0] : null)} {...rest} />
                    </FormControl>
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
