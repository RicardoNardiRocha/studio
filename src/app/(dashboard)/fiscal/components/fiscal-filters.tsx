'use client';

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Company } from "@/components/empresas/company-details-dialog";
import { useMemo } from "react";

interface FiscalFiltersProps {
  selectedCompany: string | null;
  onCompanyChange: (companyId: string | null) => void;
  // Adicione outras props de filtro conforme necessário
}

export function FiscalFilters({ selectedCompany, onCompanyChange }: FiscalFiltersProps) {
  const firestore = useFirestore();
  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('name', 'asc'));
  }, [firestore]);
  
  const { data: companies, isLoading: isLoadingCompanies } = useCollection<Company>(companiesQuery);

  return (
    <div className="flex items-center space-x-4">
      <Select 
        value={selectedCompany || 'all'} 
        onValueChange={value => onCompanyChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Empresa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Empresas</SelectItem>
          {isLoadingCompanies ? (
            <SelectItem value="loading" disabled>Carregando...</SelectItem>
          ) : (
            companies?.map(company => (
              <SelectItem key={company.id} value={company.id}>{
                company.name
              }</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"outline"} className="w-[240px] justify-start text-left font-normal">
            {/* Calendar icon */}
            <span>Selecione o mês</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" initialFocus />
        </PopoverContent>
      </Popover>

      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo de Obrigação" />
        </SelectTrigger>
        <SelectContent>
          {/* Populate with obligation types */}
          <SelectItem value="federal">Federal</SelectItem>
          <SelectItem value="estadual">Estadual</SelectItem>
          <SelectItem value="municipal">Municipal</SelectItem>
        </SelectContent>
      </Select>

      <Button>Filtrar</Button>
    </div>
  );
}
