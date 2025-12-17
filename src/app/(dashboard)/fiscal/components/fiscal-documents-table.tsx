'use client';

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
import { MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { FiscalDocument } from './fiscal-client';

const getStatusVariant = (status: FiscalDocument['status']): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined => {
    switch (status) {
      case 'Ativa': return 'default';
      case 'Cancelada': return 'destructive';
      case 'Inutilizada': return 'secondary';
      case 'Denegada': return 'destructive';
      case 'Rejeitada': return 'outline';
      default: return 'secondary';
    }
};

type FiscalDocumentsTableProps = {
  documents: FiscalDocument[];
  isLoading: boolean;
};

export function FiscalDocumentsTable({ documents, isLoading }: FiscalDocumentsTableProps) {
  return (
    <div className="border rounded-md mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Competência</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data de Upload</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.companyName}</TableCell>
                <TableCell>{doc.companyCnpj}</TableCell>
                <TableCell>{doc.competencia}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                </TableCell>
                <TableCell>{new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="icon" onClick={() => alert('Detalhes a ser implementado')}>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Ver Detalhes</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhum documento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
