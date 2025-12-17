'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AddObligationDialog } from "./add-obligation-dialog";
import { ObligationDetailsDialog } from "./obligation-details-dialog";

export interface Obligation {
  id: string;
  name: string;
  dueDate: string; 
  status: 'delivered' | 'pending' | 'overdue';
  companyName: string; 
  companyId: string;
  responsibleName: string; 
}

const statusVariant = {
  delivered: 'success',
  pending: 'warning',
  overdue: 'destructive',
} as const;

interface ObligationsTableProps {
  obligations: Obligation[];
  isLoading: boolean;
}

export function ObligationsTable({ obligations, isLoading }: ObligationsTableProps) {

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <AddObligationDialog />
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Obrigação</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
              ))
            ) : obligations && obligations.length > 0 ? (
              obligations.map((obligation) => (
                <TableRow key={obligation.id}>
                  <TableCell className="font-medium">{obligation.name}</TableCell>
                  <TableCell>{obligation.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[obligation.status]}>
                      {obligation.status === 'pending' ? 'Pendente' : obligation.status === 'delivered' ? 'Entregue' : 'Atrasada'}
                    </Badge>
                  </TableCell>
                  <TableCell>{obligation.companyName}</TableCell>
                  <TableCell>{obligation.responsibleName}</TableCell>
                  <TableCell className="text-right">
                    <ObligationDetailsDialog obligation={obligation} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhuma obrigação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
