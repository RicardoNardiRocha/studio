'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  cnpj: z.string().optional(),
  // Novo campo para o controle de XML
  receivesXml: z.boolean().default(false),
});

type CompanyEditFormProps = {
  companyId: string;
  initialData: {
    name: string;
    cnpj?: string;
    receivesXml?: boolean;
  };
};

export function CompanyEditForm({ companyId, initialData }: CompanyEditFormProps) {
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        ...initialData,
        receivesXml: initialData.receivesXml || false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    const toastId = toast.loading('Salvando alterações...');

    try {
      const companyRef = doc(firestore, 'companies', companyId);
      await updateDoc(companyRef, {
        ...values,
        updatedAt: serverTimestamp(),
      });

      toast.success('Empresa atualizada com sucesso!', { id: toastId });
      router.push('/companies'); // Redireciona para a lista de empresas
    } catch (error) {
      console.error("Erro ao atualizar empresa: ", error);
      toast.error('Não foi possível salvar as alterações.', { id: toastId });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Nome Fantasia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000/0000-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="receivesXml"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Controle Fiscal de XML</FormLabel>
                        <FormDescription>
                            Marque esta opção se a empresa deve aparecer no controle de envio de arquivos XML.
                        </FormDescription>
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
        <Button type="submit">Salvar Alterações</Button>
      </form>
    </Form>
  );
}
