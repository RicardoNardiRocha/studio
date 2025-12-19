
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import type { CorporateProcess, ProcessStatus, ProcessPriority } from './corporate-processes-client';
import { Badge } from '../ui/badge';
import { ArrowUp, ArrowRight, ArrowDown, Calendar, CalendarCheck, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface ProcessCardProps {
  process: CorporateProcess;
  onClick?: () => void;
  onStatusChange: (newStatus: ProcessStatus) => void;
  canUpdate: boolean;
  statuses: ProcessStatus[];
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

const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date.seconds) return new Date(date.seconds * 1000);
    if (typeof date === 'string') {
        try {
            return new Date(date);
        } catch (e) {
            return undefined;
        }
    }
    return undefined;
}


export function ProcessCard({ process, onClick, onStatusChange, canUpdate, statuses }: ProcessCardProps) {
  const { Icon, className: priorityClassName } = getPriorityInfo(process.priority);
  const startDate = toDate(process.startDate);
  const protocolDate = toDate(process.protocolDate);
  const completionDate = toDate(process.completionDate);

  return (
    <Card
      className={`hover:shadow-lg transition-shadow border-l-4 ${process.status === 'Cancelado' ? 'border-gray-400' : 'border-primary'}`}
    >
      <div onClick={onClick} className="cursor-pointer">
        <CardHeader className="p-3 pb-2 flex-row items-start justify-between">
          <div className='flex-1 overflow-hidden'>
            <p className="text-xs text-muted-foreground truncate">{process.companyName}</p>
            <CardTitle className="text-sm font-bold leading-tight truncate">{process.processType}</CardTitle>
          </div>
          <div className="text-right pl-2">
             {startDate && (
                <>
                    <p className="text-xl font-bold">{format(startDate, 'dd')}</p>
                    <p className="text-xs text-muted-foreground -mt-1">{format(startDate, 'MMM')}</p>
                </>
            )}
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
              <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Início:</span>
              <span className="font-semibold text-foreground">{startDate ? format(startDate, 'dd/MM/yy') : 'N/A'}</span>
           </div>
            {protocolDate && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><CalendarCheck className="h-3 w-3" /> Protocolo:</span>
                <span className="font-semibold text-foreground">{format(protocolDate, 'dd/MM/yy')}</span>
              </div>
            )}
            {completionDate && (
              <div className="flex items-center justify-between text-green-600">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3" /> Concluído em:</span>
                <span className="font-semibold">{format(completionDate, 'dd/MM/yy')}</span>
              </div>
            )}
        </CardContent>
      </div>
       <div className="p-3 pt-0">
          <Select 
            value={process.status} 
            onValueChange={(newStatus: ProcessStatus) => onStatusChange(newStatus)}
            disabled={!canUpdate}
          >
            <SelectTrigger 
              className="w-full h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 bg-transparent"
              onClick={(e) => e.stopPropagation()} // Prevent card's onClick
            >
              <SelectValue asChild>
                  <Badge variant={getStatusBadgeVariant(process.status)} className='text-xs w-full justify-center'>
                      {process.status}
                  </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent onClick={(e) => e.stopPropagation()}>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  <Badge variant={getStatusBadgeVariant(status)} className="border-none shadow-none font-medium">{status}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
       </div>
    </Card>
  );
}
