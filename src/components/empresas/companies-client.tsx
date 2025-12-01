'use client';

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
import { companies } from '@/lib/data';

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined => {
  if (!status) return 'secondary';
  switch (status.toLowerCase()) {
    case 'ativa': return 'default';
    case 'apto': return 'default';
    case 'inapta': return 'destructive';
    case 'baixada': return 'outline';
    default: return 'secondary';
  }
};

export function CompaniesClient() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Cadastro Mestre de Empresas</CardTitle>
        <CardDescription>
          Visualize e gerencie todas as empresas atendidas pelo escritório.
        </CardDescription>
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
                    <Link href={`/empresas/${company.cnpj.replace(/[^\d]/g, "")}`}>
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
