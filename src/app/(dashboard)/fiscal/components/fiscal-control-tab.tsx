'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';

// --- Tipos --- //

type Company = { 
  id: string; 
  name: string; 
  cnpj: string; 
  // Indica se a empresa deve aparecer no controle fiscal.
  receivesXml: boolean; 
};

// Novo tipo para o status do XML, agora com mais opções.
export type XmlStatusOption = 'Pendente' | 'Aguardando Reenvio' | 'Enviado';

// Armazena o status no Firestore
type XmlStatus = { 
  companyId: string; 
  month: number; 
  year: number; 
  status: XmlStatusOption; 
};

// Tipo combinado para exibição na tabela
type CompanyStatus = {
  companyId: string;
  companyName: string;
  companyCnpj: string;
  status: XmlStatusOption;
};

const statusOptions: XmlStatusOption[] = ['Pendente', 'Aguardando Reenvio', 'Enviado'];

// --- Componente --- //

export function FiscalControlTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();

  // --- Consultas ao Firestore --- //
  const companiesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'companies') : null, [firestore]);
  const xmlStatusQuery = useMemoFirebase(() => firestore ? collection(firestore, 'xmlStatus') : null, [firestore]);

  const { data: companies, isLoading: loadingCompanies } = useCollection<Company>(companiesQuery);
  const { data: xmlStatuses, isLoading: loadingXmlStatuses, forceRefetch } = useCollection<XmlStatus>(xmlStatusQuery);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // --- Lógica de Status --- //
  const companyStatuses = useMemo<CompanyStatus[]>(() => {
    if (!companies) return [];

    // 1. Filtra apenas empresas que recebem XML
    const relevantCompanies = companies.filter(c => c.receivesXml === true);

    // 2. Mapeia o status para cada empresa
    let allStatuses = relevantCompanies.map(c => {
      const defaultStatus: CompanyStatus = {
        companyId: c.id,
        companyName: c.name,
        companyCnpj: c.cnpj,
        status: 'Pendente',
      };

      // Encontra o status salvo no DB para o mês/ano atual
      const savedStatus = xmlStatuses?.find(s => 
        s.companyId === c.id && 
        s.month === currentMonth && 
        s.year === currentYear
      );

      if (savedStatus) {
        defaultStatus.status = savedStatus.status;
      }
      
      return defaultStatus;
    });

    // 3. Filtra por termo de busca
    if (searchTerm) {
      return allStatuses.filter(c => 
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyCnpj.includes(searchTerm)
      );
    }
    
    return allStatuses;
  }, [companies, xmlStatuses, currentMonth, currentYear, searchTerm]);

  // --- Ações --- //
  const handleStatusChange = async (companyId: string, newStatus: XmlStatusOption) => {
    if (!firestore) return;
  
    const toastId = toast.loading(`Alterando status para ${newStatus}...`);
  
    try {
      const batch = writeBatch(firestore);
      // O ID do documento de status é único por empresa/mês/ano
      const statusRef = doc(firestore, 'xmlStatus', `${companyId}_${currentMonth}_${currentYear}`);
      
      batch.set(statusRef, { 
        companyId, 
        month: currentMonth, 
        year: currentYear, 
        status: newStatus 
      }, { merge: true });
  
      await batch.commit();
      toast.success('Status alterado com sucesso!', { id: toastId });
      forceRefetch(); // Atualiza a UI
    } catch (error) {
      console.error("Erro ao alterar status: ", error);
      toast.error('Erro ao alterar status.', { id: toastId });
    }
  };

  const isLoading = loadingCompanies || loadingXmlStatuses;

  // --- Renderização --- //
  return (
    <div>
      <div className="flex flex-col md:flex-row items-center gap-4 my-4">
        <Input
            placeholder="Buscar por empresa ou CNPJ..."
            className="pl-8 w-full md:flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button className="w-full md:w-auto" onClick={() => alert('Adicionar notas a ser implementado')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Notas
        </Button>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead className="text-center w-[200px]">Status do XML</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-9 w-40" /></TableCell>
                </TableRow>
              ))
            ) : companyStatuses.length > 0 ? (
              companyStatuses.map((item) => (
                <TableRow key={item.companyId}>
                  <TableCell className="font-medium">{item.companyName}</TableCell>
                  <TableCell>{item.companyCnpj}</TableCell>
                  <TableCell className="text-center">
                    <Select 
                      value={item.status}
                      onValueChange={(newStatus: XmlStatusOption) => handleStatusChange(item.companyId, newStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Nenhuma empresa configurada para receber XML.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
