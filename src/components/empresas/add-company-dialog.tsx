'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos').max(18, 'CNPJ inválido'),
});

type FormValues = z.infer<typeof formSchema>;

export function AddCompanyDialog({ onCompanyAdded }: { onCompanyAdded: (company: any) => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cnpj: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const cnpj = values.cnpj.replace(/[^\d]/g, '');
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) {
        throw new Error('Não foi possível encontrar a empresa. Verifique o CNPJ.');
      }
      const data = await response.json();
      
      const newCompany = {
        name: data.razao_social,
        cnpj: data.cnpj,
        taxRegime: data.opcao_pelo_simples ? 'Simples Nacional' : 'Não informado',
        status: data.descricao_situacao_cadastral,
        startDate: data.data_inicio_atividade,
      };

      onCompanyAdded(newCompany);
      
      toast({
        title: 'Empresa Adicionada!',
        description: `${newCompany.name} foi adicionada com sucesso.`,
      });

      setOpen(false);
      form.reset();
      router.push(`/empresas/${newCompany.cnpj}`);

    } catch (error: any) {
      toast({
        title: 'Erro ao Adicionar Empresa',
        description: error.message || 'Ocorreu um erro ao buscar os dados da empresa.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Empresa</DialogTitle>
          <DialogDescription>
            Digite o CNPJ da empresa para buscar e adicionar as informações automaticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ (apenas números)</FormLabel>
                  <FormControl>
                    <Input placeholder="00000000000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Buscando...' : 'Adicionar Empresa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
