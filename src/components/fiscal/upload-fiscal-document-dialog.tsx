'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useUser, useStorage, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Input } from '../ui/input';
import { format } from 'date-fns';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logActivity } from '@/lib/activity-log';
import ReactSelect from 'react-select';

interface UploadFiscalDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
  defaultDocumentType?: 'Livro de Saída' | 'Livro de Entrada' | 'Nota Fiscal de Entrada' | 'Nota Fiscal de Saída';
}

const allDocumentTypes = ['Livro de Entrada', 'Livro de Saída', 'Nota Fiscal de Entrada', 'Nota Fiscal de Saída'];
const noteStatuses = ['Ativa', 'Cancelada', 'Inutilizada', 'Denegada', 'Rejeitada'];


const formSchema = z.object({
  companyId: z.string({ required_error: 'Selecione uma empresa.' }),
  documentType: z.string({ required_error: 'Selecione o tipo de documento.' }),
  competencia: z.string().regex(/^\d{2}\/\d{4}$/, "Formato inválido. Use MM/AAAA."),
  file: z.any().refine(file => file?.length > 0, 'O arquivo é obrigatório.'),
  status: z.string().optional(), // Tornando opcional
});

type CompanyOption = { value: string; label: string; };
type Company = { id: string; name: string, cnpj: string };

export function UploadFiscalDocumentDialog({
  open,
  onOpenChange,
  onUploadComplete,
  defaultDocumentType,
}: UploadFiscalDocumentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const [competenceInput, setCompetenceInput] = useState(format(new Date(), 'MM/yyyy'));

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
      competencia: format(new Date(), 'MM/yyyy'),
      documentType: defaultDocumentType || '',
      status: 'Ativa',
    },
  });

  const documentType = form.watch('documentType');
  const isNote = documentType?.includes('Nota Fiscal');

  useEffect(() => {
    if (open) {
      form.reset({
        competencia: format(new Date(), 'MM/yyyy'),
        documentType: defaultDocumentType || '',
        companyId: '',
        file: undefined,
        status: 'Ativa',
      });
      setCompetenceInput(format(new Date(), 'MM/yyyy'));
    }
  }, [open, defaultDocumentType, form]);

  const handleCompetenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 6);
    }
    setCompetenceInput(value);
    form.setValue('competencia', value);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user || !storage) {
      toast({ title: 'Erro', description: 'Serviços indisponíveis.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const company = companies?.find(c => c.id === values.companyId);
      if (!company) throw new Error("Empresa não encontrada.");

      const file: File = values.file[0];
      const filePath = `fiscalDocuments/${company.id}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, filePath);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);
      
      const docCollectionRef = collection(firestore, 'fiscalDocuments');
      const newDoc = {
          companyId: company.id,
          companyName: company.name,
          companyCnpj: company.cnpj,
          documentType: values.documentType,
          status: values.status || 'Ativa', // Usa o status do form ou 'Ativa' como fallback
          competencia: values.competencia,
          uploadedAt: new Date().toISOString(),
          fileUrl,
      };

      const docRef = await addDoc(docCollectionRef, newDoc);
      await updateDoc(doc(docCollectionRef, docRef.id), { id: docRef.id });

      logActivity(firestore, user, `enviou o documento fiscal ${values.documentType} para ${company.name}.`);

      toast({
        title: 'Documento Enviado!',
        description: `O documento fiscal para ${company.name} foi salvo.`,
      });

      onUploadComplete();
      onOpenChange(false);

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro no Upload', description: error.message || 'Ocorreu um erro inesperado.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Documento Fiscal</DialogTitle>
          <DialogDescription>
            Preencha os dados e selecione o arquivo para enviar.
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
                      styles={{
                        control: (base) => ({ ...base, background: 'transparent', borderColor: 'hsl(var(--input))' }),
                        menu: (base) => ({ ...base, zIndex: 100 }),
                        input: (base) => ({ ...base, color: 'hsl(var(--foreground))' }),
                        singleValue: (base) => ({...base, color: 'hsl(var(--foreground))'}),
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!defaultDocumentType}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            {allDocumentTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />

            {isNote && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status da Nota</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            {noteStatuses.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            )}
            
             <FormField
                control={form.control}
                name="competencia"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <FormControl>
                        <Input 
                            placeholder="MM/AAAA" 
                            value={competenceInput}
                            onChange={handleCompetenceChange}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            maxLength={7}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...rest }}) => (
                <FormItem>
                  <FormLabel>Arquivo</FormLabel>
                  <FormControl>
                    <Input type="file" onChange={e => onChange(e.target.files)} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Documento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
