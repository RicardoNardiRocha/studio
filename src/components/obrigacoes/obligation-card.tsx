'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isPast, startOfDay } from 'date-fns';
import { CheckCircle, AlertTriangle, Clock, Briefcase } from 'lucide-react';
import type { TaxObligation, ObligationStatus } from './obligations-client';
import { Badge } from '../ui/badge';


interface ObligationCardProps {
  obligation: TaxObligation;
  onClick?: () => void;
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

export function ObligationCard({ obligation, onClick }: ObligationCardProps) {
  const { color, icon: Icon } = getStatusInfo(obligation.displayStatus || obligation.status);

  const formatPeriod = (period: string) => {
    try {
        const [year, month] = period.split('-');
        return `${month}/${year}`;
    } catch {
        return period;
    }
  }

  return (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer border-t-4 ${color}`}
      onClick={onClick}
    >
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
            <span className="font-semibold text-foreground">{formatPeriod(obligation.periodo)}</span>
         </div>
         <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
                Status:
            </span>
            <Badge variant={obligation.displayStatus === 'Atrasada' ? 'destructive' : obligation.displayStatus === 'Entregue' ? 'default' : 'secondary'} className='text-xs'>
                {obligation.displayStatus}
            </Badge>
         </div>
         <div className="flex items-center justify-between pt-1 mt-1 border-t">
            <span className="flex items-center gap-1.5">
                Responsável:
            </span>
            <span className="font-semibold text-foreground truncate">{obligation.responsavelNome || 'N/D'}</span>
         </div>
      </CardContent>
    </Card>
  );
}
