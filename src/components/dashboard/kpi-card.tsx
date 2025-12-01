import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as Icons from 'lucide-react';

type KpiCardProps = {
  title: string;
  value: string;
  icon: keyof typeof Icons | LucideIcon;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  description: string;
};

const ChangeIcon = ({ type }: { type: KpiCardProps['changeType'] }) => {
  if (type === 'increase') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (type === 'decrease') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export function KpiCard({ title, value, icon, change, changeType, description }: KpiCardProps) {
  const IconComponent = typeof icon === 'string' ? Icons[icon as keyof typeof Icons] : icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {change && changeType && (
            <span className="flex items-center gap-1 font-semibold">
              <ChangeIcon type={changeType} />
              {change}
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
