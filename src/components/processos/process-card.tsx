'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import type { CorporateProcess, ProcessStatus, ProcessPriority } from './corporate-processes-client';
import { Badge } from '../ui/badge';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

interface ProcessCardProps {
  process: CorporateProcess;
  onClick?: () => void;
}

const getStatusBadgeVariant = (status: ProcessStatus): 'success' | 'info' | 'cyan' | 'warning' | 'destructive' | 'outline' | 'secondary' => {
  switch (status) {
    case 'Concluído': return 'success';
    case 'Em Análise': case 'Protocolado': return 'info';
    case 'Em Preenchimento': case 'Em Andamento Externo': return 'cyan';
    case 'Aguardando Documentação': case 'Aguardando Cliente': case 'Aguardando Órgão': return 'warning';
    case 'Em Exigência': return 'destructive';
    case 'Cancelado': return 'outline';
    default: return 'secondary';
  }
};

const getPriorityInfo = (priority: ProcessPriority) => {
  switch (priority) {
    case 'Alta': return { Icon: ArrowUp, className: 'text-destructive' };
    case 'Média': return { Icon: ArrowRight, className: 'text-yellow-500' };
    case 'Baixa': return { Icon: ArrowDown, className: 'text-green-500' };
    default: return { Icon: ArrowRight, className: 'text-muted-foreground' };
  }
}

const toDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (date.seconds) return new Date(date.seconds * 1000);
  return new Date(date);
}

export function ProcessCard({ process, onClick }: ProcessCardProps) {
  const { Icon, className: priorityClassName } = getPriorityInfo(process.priority);
  const startDate = toDate(process.startDate);

  return (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${process.status === 'Cancelado' ? 'border-gray-400' : 'border-primary'}`}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2 flex-row items-start justify-between">
        <div className='flex-1 overflow-hidden'>
          <p className="text-xs text-muted-foreground truncate">{process.companyName}</p>
          <CardTitle className="text-sm font-bold leading-tight truncate">{process.processType}</CardTitle>
        </div>
        <div className="text-right pl-2">
          <p className="text-xl font-bold">{format(startDate, 'dd')}</p>
          <p className="text-xs text-muted-foreground -mt-1">{format(startDate, 'MMM')}</p>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-1.5">
         <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">Prioridade:</span>
            <div className={`flex items-center gap-1 font-semibold ${priorityClassName}`}>
               <Icon className="h-4 w-4" />
               <span>{process.priority}</span>
            </div>
         </div>
         <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">Status:</span>
            <Badge variant={getStatusBadgeVariant(process.status)} className='text-xs'>
                {process.status}
            </Badge>
         </div>
      </CardContent>
    </Card>
  );
}
