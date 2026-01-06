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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { format, lastDayOfMonth } from 'date-fns';
import { Input } from '../ui/input';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';

interface BatchInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const formSchema = z.object({
  referencePeriod: z.string().regex(/^\d{2}\/\d{4}$/, 'Formato inválido. Use MM/AAAA.'),
  amount: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
});

type Company = { id: string; name: string };

export function BatchInvoiceDialog({ open, onOpenChange, onComplete }: BatchInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const firestore = useFirestore();
  const [competenceInput, setCompetenceInput] = useState(format(new Date(), 'MM/yyyy'));


  const companiesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'));
  }, [firestore]);
  const { data: companies } = useCollection<Company>(companiesCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referencePeriod: format(new Date(), 'MM/yyyy'),
      amount: 300,
    },
  });

  const handleCompetenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 6);
    }
    setCompetenceInput(value);
    form.setValue('referencePeriod', value);
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !companies || companies.length === 0) {
      toast({ title: 'Erro', description: 'Nenhuma empresa encontrada para faturar.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setProgress(0);

    let generatedCount = 0;
    let skippedCount = 0;
    const totalCompanies = companies.length;
    const { referencePeriod, amount } = values;

    const [month, year] = referencePeriod.split('/').map(Number);
    const competenceDate = new Date(year, month - 1, 1);
    const dueDate = lastDayOfMonth(competenceDate);
    const description = `Mensalidade ${referencePeriod}`;


    const invoicesRef = collection(firestore, 'invoices');
    const companiesToBill = [...companies];
    
    // Check for existing invoices in chunks to avoid large 'in' queries
    const CHUNK_SIZE = 30;
    for (let i = 0; i < companiesToBill.length; i += CHUNK_SIZE) {
        const chunk = companiesToBill.slice(i, i + CHUNK_SIZE);
        const companyIds = chunk.map(c => c.id);
        
        const q = query(invoicesRef, where('companyId', 'in', companyIds), where('description', '==', description));
        const existingInvoicesSnap = await getDocs(q);
        const existingCompanyIds = new Set(existingInvoicesSnap.docs.map(d => d.data().companyId));

        const batch = writeBatch(firestore);

        chunk.forEach(company => {
            if (existingCompanyIds.has(company.id)) {
                skippedCount++;
            } else {
                const newInvoiceRef = doc(invoicesRef);
                batch.set(newInvoiceRef, {
                    id: newInvoiceRef.id,
                    companyId: company.id,
                    companyName: company.name,
                    description: description,
                    amount,
                    dueDate,
                    status: 'Pendente',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                generatedCount++;
            }
        });

        await batch.commit();
        setProgress(((i + chunk.length) / totalCompanies) * 100);
    }


    toast({
      title: 'Faturamento em Lote Concluído!',
      description: `${generatedCount} faturas geradas. ${skippedCount} empresas já faturadas para este período foram ignoradas.`,
    });

    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Mensalidades em Lote</DialogTitle>
          <DialogDescription>
            Crie mensalidades para todas as empresas ativas para um período de competência.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Atenção!</AlertTitle>
              <AlertDescription>
                Esta ação criará faturas para{' '}
                <strong>{companies?.length || 0} empresas</strong>. O sistema
                ignora automaticamente empresas que já possuem uma mensalidade para o
                mês selecionado.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="referencePeriod"
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Padrão (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {isLoading && (
              <div className="space-y-2">
                  <Label>Progresso da Geração</Label>
                  <Progress value={progress} />
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  `Gerar ${companies?.length || 0} Faturas`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
