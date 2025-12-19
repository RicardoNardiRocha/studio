'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isPast, startOfDay } from 'date-fns';
import { CheckCircle, AlertTriangle, Clock, Briefcase, CalendarCheck } from 'lucide-react';
import type { TaxObligation, ObligationStatus } from './obligations-client';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


interface ObligationCardProps {
  obligation: TaxObligation;
  onClick?: () => void;
  onStatusChange: (newStatus: ObligationStatus) => void;
  canUpdate: boolean;
  statuses: ObligationStatus[];
}

const getStatusInfo = (status: ObligationStatus): { color: string; icon: React.ElementType } => {
  switch (status) {
    case 'Atrasada':
      return { color: 'border-t-destructive', icon: AlertTriangle };
    case 'Pendente':
      return { color: 'border-t-yellow-500', icon: Clock };
    case 'Em Andamento':
      return { color: 'border-t-blue-500', icon: Clock };
    case 'Entregue':
      return { color: 'border-t-green-500', icon: CheckCircle };
    default:
      return { color: 'border-t-gray-300', icon: Briefcase };
  }
};

const getStatusBadgeVariant = (status?: ObligationStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline';
  switch (status) {
    case 'Entregue': return 'default';
    case 'Atrasada': return 'destructive';
    case 'Pendente': return 'secondary';
    case 'Em Andamento': return 'secondary'; // Could be another color
    case 'Cancelada': return 'outline';
    default: return 'outline';
  }
};

const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date.seconds) return new Date(date.seconds * 1000);
    return undefined;
}

export function ObligationCard({ obligation, onClick, onStatusChange, canUpdate, statuses }: ObligationCardProps) {
  const { color, icon: Icon } = getStatusInfo(obligation.displayStatus || obligation.status);

  const formatPeriod = (period: string) => {
    try {
        const [year, month] = period.split('-');
        if (month && year) {
           return `${month}/${year}`;
        }
        return period;
    } catch {
        return period;
    }
  }
  
  const dataEntrega = toDate(obligation.dataEntrega);

  return (
    <Card
      className={`hover:shadow-lg transition-shadow flex flex-col justify-between border-t-4 ${color}`}
    >
      <div onClick={onClick} className="cursor-pointer">
        <CardHeader className="p-3 pb-2 flex-row items-start justify-between">
          <div className='flex-1 overflow-hidden'>
            <p className="text-xs text-muted-foreground truncate">{obligation.companyName}</p>
            <CardTitle className="text-sm font-bold leading-tight truncate">{obligation.nome}</CardTitle>
          </div>
          <div className="text-right pl-2">
            <p className="text-xl font-bold">{format(obligation.dataVencimento instanceof Date ? obligation.dataVencimento : obligation.dataVencimento.toDate(), 'dd')}</p>
            <p className="text-xs text-muted-foreground -mt-1">{format(obligation.dataVencimento instanceof Date ? obligation.dataVencimento : obligation.dataVencimento.toDate(), 'MMM')}</p>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-1.5">
           <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                  Competência:
              </span>
              <span className="font-semibold text-foreground">{obligation.periodo}</span>
           </div>
           {dataEntrega && (
             <div className="flex items-center justify-between text-green-600">
                <span className="flex items-center gap-1.5">
                    <CalendarCheck className="h-3 w-3" />
                    Entregue dia:
                </span>
                <span className="font-semibold">{format(dataEntrega, 'dd/MM/yyyy')}</span>
             </div>
           )}
           <div className="flex items-center justify-between pt-1 mt-1 border-t">
              <span className="flex items-center gap-1.5">
                  Responsável:
              </span>
              <span className="font-semibold text-foreground truncate">{obligation.responsavelNome || 'N/D'}</span>
           </div>
        </CardContent>
      </div>
      <div className="p-3 pt-0">
          <Select 
            value={obligation.status} 
            onValueChange={(newStatus: ObligationStatus) => onStatusChange(newStatus)}
            disabled={!canUpdate}
          >
            <SelectTrigger 
              className="w-full h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 bg-transparent"
              onClick={(e) => e.stopPropagation()} // Prevent card's onClick
            >
              <SelectValue asChild>
                  <Badge variant={getStatusBadgeVariant(obligation.displayStatus)} className='text-xs w-full justify-center'>
                      {obligation.displayStatus}
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
