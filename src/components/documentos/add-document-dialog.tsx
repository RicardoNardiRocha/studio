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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useStorage } from '@/firebase';
import { addDoc, collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '../ui/input';
import { uploadFile } from '@/lib/storage/upload';

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentAdded: () => void;
}

const documentTypes = ['Contrato Social', 'Alvará', 'Certidão Negativa', 'Procuração', 'Documento Fiscal', 'Outro'];

const formSchema = z.object({
  companyId: z.string({ required_error: 'Selecione uma empresa.' }),
  name: z.string().min(3, 'O nome do arquivo é obrigatório.'),
  type: z.string({ required_error: 'Selecione o tipo de documento.' }),
  file: z.any().refine(file => file?.length == 1, 'O arquivo é obrigatório.'),
  expirationDate: z.date().optional(),
});

type Company = { id: string; name: string };

export function AddDocumentDialog({ open, onOpenChange, onDocumentAdded }: AddDocumentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();

  const companiesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: companies } = useCollection<Company>(companiesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !storage || !user) {
      toast({ title: 'Erro', description: 'Serviços de nuvem ou autenticação indisponíveis.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const company = companies?.find(c => c.id === values.companyId);
      if (!company) throw new Error('Empresa não encontrada.');

      const fileToUpload = values.file[0] as File;
      
      // 1. Upload do arquivo para o Storage
      const folder = `companies/${company.id}/documents`;
      const fileUrl = await uploadFile(storage, folder, fileToUpload);
      
      // 2. Criação do documento no Firestore
      const documentCollectionRef = collection(firestore, 'companies', values.companyId, 'documents');
      
      const newDocument = {
        companyId: values.companyId,
        companyName: company.name,
        name: values.name,
        type: values.type,
        expirationDate: values.expirationDate || null,
        uploadDate: new Date(),
        responsibleUserId: user.uid,
        responsibleUserName: user.displayName || 'Não definido',
        fileUrl: fileUrl,
        fileName: fileToUpload.name,
      };

      const docRef = await addDoc(documentCollectionRef, newDocument);
      await updateDoc(doc(documentCollectionRef, docRef.id), { id: docRef.id });

      toast({
        title: 'Documento Adicionado!',
        description: `O arquivo ${values.name} foi salvo para ${company.name}.`,
      });

      onDocumentAdded();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro ao adicionar documento', description: error.message || 'Ocorreu um erro inesperado.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fileRef = form.register("file");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Documento</DialogTitle>
          <DialogDescription>
            Preencha os dados e selecione o arquivo para upload.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger></FormControl>
                    <SelectContent>{companies?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Arquivo</FormLabel>
                        <FormControl>
                            <Input type="file" {...fileRef} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Documento</FormLabel>
                  <FormControl><Input placeholder="Ex: Contrato Social 3ª Alteração" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                    <SelectContent>{documentTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar e Fazer Upload
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
