'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ConfigureXmlCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

type Company = { 
  id: string; 
  name: string; 
  receivesXml: boolean;
};

export function ConfigureXmlCompaniesDialog({
  open,
  onOpenChange,
  onSave,
}: ConfigureXmlCompaniesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCompanies, setSelectedCompanies] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const firestore = useFirestore();

  const companiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'companies') : null, [firestore]);
  const { data: companies, isLoading: loadingCompanies } = useCollection<Company>(companiesQuery);

  useEffect(() => {
    if (companies) {
      const initialSelection = companies.reduce((acc, company) => {
        acc[company.id] = company.receivesXml || false;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedCompanies(initialSelection);
    }
  }, [companies]);

  const filteredAndSortedCompanies = useMemo(() => {
    if (!companies) return [];
    return companies
      .filter(c => c && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.name.localeCompare(b.name);
        }
        return b.name.localeCompare(a.name);
      });
  }, [companies, searchTerm, sortOrder]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsLoading(true);
    const toastId = toast({ title: 'Salvando configurações...' });

    try {
      const batch = writeBatch(firestore);
      Object.entries(selectedCompanies).forEach(([companyId, isSelected]) => {
        const companyRef = doc(firestore, 'companies', companyId);
        batch.update(companyRef, { receivesXml: isSelected });
      });
      await batch.commit();

      toast({ id: toastId, title: 'Sucesso!', description: 'Configurações de controle XML salvas.' });
      onSave();
    } catch (error) {
      console.error("Error saving XML configuration: ", error);
      toast({ id: toastId, title: 'Erro!', description: 'Não foi possível salvar as configurações.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAll = (check: boolean) => {
    const newSelection: Record<string, boolean> = {};
    filteredAndSortedCompanies.forEach(c => {
        newSelection[c.id] = check;
    });
    setSelectedCompanies(prev => ({...prev, ...newSelection}));
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Empresas para Controle XML</DialogTitle>
          <DialogDescription>
            Selecione quais empresas devem aparecer na aba "Controle" para o monitoramento de XML.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar empresa..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                    {sortOrder === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                </Button>
            </div>

            <div className='flex items-center space-x-2'>
                 <Checkbox id="toggle-all" onCheckedChange={(checked) => handleToggleAll(checked as boolean)} />
                 <Label htmlFor="toggle-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Marcar/Desmarcar todas as visíveis
                 </Label>
            </div>

            <ScrollArea className="h-72 w-full rounded-md border p-4">
                {loadingCompanies ? (
                    <p>Carregando...</p>
                ) : filteredAndSortedCompanies.length > 0 ? (
                    <div className="space-y-2">
                        {filteredAndSortedCompanies.map(company => (
                            <div key={company.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={company.id}
                                    checked={selectedCompanies[company.id] || false}
                                    onCheckedChange={(checked) => {
                                        setSelectedCompanies(prev => ({
                                            ...prev,
                                            [company.id]: checked as boolean
                                        }));
                                    }}
                                />
                                <Label htmlFor={company.id} className="font-normal">{company.name}</Label>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center">Nenhuma empresa encontrada.</p>
                )}
            </ScrollArea>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
