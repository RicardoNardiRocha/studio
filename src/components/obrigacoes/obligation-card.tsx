'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import type { ObligationStatus } from './obligations-client';

export interface ObligationGroup {
  name: string;
  dueDate: Date;
  total: number;
  entregue: number;
  pendente: number;
  atrasada: number;
  em_andamento: number;
  status: 'Entregue' | 'Pendente' | 'Atrasada';
}

interface ObligationCardProps {
  group: ObligationGroup;
  onClick?: () => void;
}

const getStatusColor = (status: ObligationGroup['status']): string => {
  switch (status) {
    case 'Atrasada':
      return 'border-t-destructive';
    case 'Pendente':
      return 'border-t-yellow-500';
    case 'Entregue':
      return 'border-t-green-500';
    default:
      return 'border-t-gray-300';
  }
};

export function ObligationCard({ group, onClick }: ObligationCardProps) {
  const statusColorClass = getStatusColor(group.status);

  return (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer border-t-4 ${statusColorClass}`}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold leading-tight">{group.name}</CardTitle>
        <div className="text-right">
          <p className="text-xl font-bold">{format(group.dueDate, 'dd')}</p>
          <p className="text-xs text-muted-foreground">{format(group.dueDate, 'MMM')}</p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 text-xs text-muted-foreground space-y-1.5">
         <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Entregues
            </span>
            <span className="font-semibold text-foreground">{group.entregue}</span>
         </div>
         <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-yellow-500" /> Pendentes
            </span>
            <span className="font-semibold text-foreground">{group.pendente + group.em_andamento}</span>
         </div>
         <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Atrasadas
            </span>
            <span className="font-semibold text-foreground">{group.atrasada}</span>
         </div>
         <div className="pt-1 mt-1 border-t text-right">
            <p className="font-bold text-sm text-foreground">Total: {group.total}</p>
         </div>
      </CardContent>
    </Card>
  );
}
