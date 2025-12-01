'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded: (company: any) => void;
}

export function AddCompanyDialog({ open, onOpenChange, onCompanyAdded }: AddCompanyDialogProps) {
  const [cnpj, setCnpj] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const numericCnpj = cnpj.replace(/[^\d]/g, '');

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numericCnpj}`);
      
      if (!response.ok) {
        throw new Error('Não foi possível consultar o CNPJ. Verifique o número e tente novamente.');
      }
      
      const data = await response.json();
      
      const newCompany = {
        id: data.cnpj,
        name: data.razao_social,
        cnpj: data.cnpj,
        taxRegime: data.opcao_pelo_simples ? "Simples Nacional" : data.regime_tributario?.[0]?.forma_de_tributacao || "Não informado",
        status: data.descricao_situacao_cadastral,
        startDate: data.data_inicio_atividade ? new Date(data.data_inicio_atividade).toLocaleDateString('pt-BR') : 'N/A',
      };

      onCompanyAdded(newCompany);
      toast({
        title: "Empresa Adicionada!",
        description: `${newCompany.name} foi adicionada à lista.`,
      });

      onOpenChange(false);
      setCnpj('');
      // Navigate to the new company's detail page
      router.push(`/empresas/${numericCnpj}`);

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao consultar CNPJ",
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Empresa</DialogTitle>
            <DialogDescription>
              Digite o CNPJ para buscar as informações e adicionar uma nova empresa ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cnpj" className="text-right">
                CNPJ
              </Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Consultar e Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
