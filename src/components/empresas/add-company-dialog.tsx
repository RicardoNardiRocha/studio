'use client';

import { useState } from 'react';
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
import { useFirestore, useUser } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded: () => void;
}

export function AddCompanyDialog({ open, onOpenChange, onCompanyAdded }: AddCompanyDialogProps) {
  const [cnpj, setCnpj] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const onlyNumbers = value.replace(/[^\d]/g, '');

    let formattedCnpj = onlyNumbers.slice(0, 14);

    if (formattedCnpj.length > 2) {
      formattedCnpj = `${formattedCnpj.slice(0, 2)}.${formattedCnpj.slice(2)}`;
    }
    if (formattedCnpj.length > 6) {
      formattedCnpj = `${formattedCnpj.slice(0, 6)}.${formattedCnpj.slice(6)}`;
    }
    if (formattedCnpj.length > 10) {
      formattedCnpj = `${formattedCnpj.slice(0, 10)}/${formattedCnpj.slice(10)}`;
    }
    if (formattedCnpj.length > 15) {
      formattedCnpj = `${formattedCnpj.slice(0, 15)}-${formattedCnpj.slice(15)}`;
    }

    setCnpj(formattedCnpj);
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firestore) {
        toast({ title: "Erro", description: "O serviço de banco de dados não está disponível.", variant: "destructive"});
        return;
    }
     if (!user) {
      toast({ title: "Erro", description: "Você precisa estar autenticado para adicionar uma empresa.", variant: "destructive"});
      return;
    }

    setIsLoading(true);

    const numericCnpj = cnpj.replace(/[^\d]/g, '');

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numericCnpj}`);
      
      if (!response.ok) {
        throw new Error('Não foi possível consultar o CNPJ. Verifique o número e tente novamente.');
      }
      
      const data = await response.json();
      
      let taxRegime = "Lucro Presumido / Real";
      if (data.opcao_pelo_simples || data.simples_nacional) {
        taxRegime = "Simples Nacional";
      }
      
      const newCompany = {
        id: data.cnpj,
        name: data.razao_social,
        cnpj: data.cnpj,
        taxRegime: taxRegime,
        status: data.descricao_situacao_cadastral,
        startDate: data.data_inicio_atividade ? new Date(data.data_inicio_atividade).toLocaleDateString('pt-BR') : 'N/A',
        fantasyName: data.nome_fantasia || '',
        cnae: data.cnae_fiscal_descricao || '',
        address: `${data.logradouro || ''}, ${data.numero || ''}, ${data.complemento || ''} - ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}, ${data.cep || ''}`.replace(/ ,/g, '').replace(/,  -/g,', '),
        phone: data.ddd_telefone_1 || '',
        email: data.email || '',
        capital: data.capital_social || 0,
        legalNature: data.natureza_juridica || '',
        porte: data.porte || '',
        qsa: data.qsa || [],
        members: { [user.uid]: 'admin' }
      };
      
      const companyRef = doc(firestore, 'companies', newCompany.id);
      setDocumentNonBlocking(companyRef, newCompany, { merge: true });

      toast({
        title: "Empresa Adicionada!",
        description: `${newCompany.name} foi adicionada ao sistema.`,
      });

      onCompanyAdded();
      onOpenChange(false);
      setCnpj('');

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
                onChange={handleCnpjChange}
                placeholder="00.000.000/0001-00"
                className="col-span-3"
                required
                maxLength={18}
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
