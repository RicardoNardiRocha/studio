
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddObligationDialog } from "./add-obligation-dialog";
import { ObligationDetailsDialog } from "./obligation-details-dialog";

// Mock data - replace with actual data
const obligations = [
  { id: '1', name: 'DAS', dueDate: '15/07/2024', status: 'delivered', company: 'Empresa A', responsible: 'João' },
  { id: '2', name: 'DCTF', dueDate: '20/07/2024', status: 'pending', company: 'Empresa B', responsible: 'Maria' },
  { id: '3', name: 'EFD', dueDate: '25/06/2024', status: 'overdue', company: 'Empresa A', responsible: 'João' },
];

const statusVariant = {
  delivered: 'success',
  pending: 'warning',
  overdue: 'destructive',
} as const;

export function ObligationsTable() {
  return (
    <div>
       <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Todas as Obrigações</h3>
        <AddObligationDialog />
      </div>
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
          {obligations.map((obligation) => (
            <TableRow key={obligation.id}>
              <TableCell>{obligation.name}</TableCell>
              <TableCell>{obligation.dueDate}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[obligation.status as keyof typeof statusVariant]}>
                  {obligation.status}
                </Badge>
              </TableCell>
              <TableCell>{obligation.company}</TableCell>
              <TableCell>{obligation.responsible}</TableCell>
              <TableCell>
                <ObligationDetailsDialog />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
