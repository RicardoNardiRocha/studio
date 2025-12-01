'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { companies as initialCompanies } from '@/lib/data';
import { AddCompanyDialog } from './add-company-dialog';

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined => {
  switch (status.toLowerCase()) {
    case 'ativa': return 'default';
    case 'inapta': return 'destructive';
    case 'baixada': return 'outline';
    default: return 'secondary';
  }
};

export function CompaniesClient() {
  const [companies, setCompanies] = useState(initialCompanies);

  const handleCompanyAdded = (newCompany: any) => {
    // Prevent duplicates
    if (!companies.some(c => c.cnpj === newCompany.cnpj)) {
      setCompanies(prev => [...prev, newCompany]);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Cadastro Mestre de Empresas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as empresas atendidas pelo escritório.
          </CardDescription>
        </div>
        <AddCompanyDialog onCompanyAdded={handleCompanyAdded} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Regime Tributário</TableHead>
              <TableHead>Data de Início</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.cnpj}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.cnpj}</TableCell>
                <TableCell>{company.taxRegime}</TableCell>
                <TableCell>{company.startDate}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="icon">
                    <Link href={`/empresas/${company.cnpj}`}>
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Detalhes</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
