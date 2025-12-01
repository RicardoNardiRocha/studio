'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestDocumentClassification } from '@/ai/flows/suggest-document-classification';
import { summarizeFiscalDocument } from '@/ai/flows/summarize-fiscal-documents';

const formSchema = z.object({
  documentFile: z.any().optional(),
  documentText: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DocumentProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsProcessing(true);
    setSummary(null);
    setClassification(null);
    
    const file = data.documentFile?.[0];

    if (!file && !data.documentText) {
      toast({
        title: 'Nenhum dado fornecido',
        description: 'Por favor, envie um arquivo ou insira um texto para processar.',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    try {
      if (file) {
        toast({ title: 'Processando arquivo...', description: 'Gerando resumo do documento.' });
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (event) => {
          const dataUri = event.target?.result as string;
          if (dataUri) {
            const result = await summarizeFiscalDocument({ documentDataUri: dataUri });
            setSummary(result.summary);
            toast({ title: 'Sucesso!', description: 'Resumo do documento gerado.' });
          }
        };
      }

      if (data.documentText) {
        toast({ title: 'Analisando texto...', description: 'Sugerindo classificação para o texto.' });
        const result = await suggestDocumentClassification({ documentText: data.documentText });
        setClassification(result.suggestedClassification);
        toast({ title: 'Sucesso!', description: 'Classificação sugerida.' });
      }
    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: 'Erro no Processamento',
        description: 'Não foi possível processar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="documentFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resumir Documento (PDF/XML)</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept=".pdf,.xml" 
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                </FormControl>
                <FormDescription>Envie um arquivo para que a IA gere um resumo.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="documentText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classificar Texto de Documento</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Cole aqui o texto de uma nota fiscal, contrato, etc."
                    className="h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Cole um texto para que a IA sugira uma classificação.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isProcessing} className="w-full sm:w-auto">
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Processar com IA
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        {(isProcessing || summary) && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Documento</CardTitle>
            </CardHeader>
            <CardContent>
              {isProcessing && !summary ? (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> <span>Gerando resumo...</span>
                </div>
              ) : (
                <p className="text-sm">{summary}</p>
              )}
            </CardContent>
          </Card>
        )}
        {(isProcessing || classification) && (
          <Card>
            <CardHeader>
              <CardTitle>Classificação Sugerida</CardTitle>
            </CardHeader>
            <CardContent>
              {isProcessing && !classification ? (
                 <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> <span>Analisando texto...</span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-primary">{classification}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
