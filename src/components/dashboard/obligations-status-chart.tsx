'use client';

import { TrendingUp } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';

interface TaxObligation {
  status: 'Pendente' | 'Em Andamento' | 'Entregue' | 'Atrasada';
}

const chartConfig = {
  Pendente: { label: 'Pendente', color: 'hsl(var(--chart-1))' },
  'Em Andamento': { label: 'Em Andamento', color: 'hsl(var(--chart-2))' },
  Entregue: { label: 'Entregue', color: 'hsl(var(--chart-3))' },
  Atrasada: { label: 'Atrasada', color: 'hsl(var(--chart-4))' },
} satisfies ChartConfig;

export function ObligationsStatusChart() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchData = async () => {
      if (!firestore) return;
      setIsLoading(true);
      const statusCounts: Record<string, number> = {
        Pendente: 0,
        'Em Andamento': 0,
        Entregue: 0,
        Atrasada: 0,
      };

      try {
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));
        for (const companyDoc of companiesSnapshot.docs) {
          const obligationsQuery = query(collection(firestore, `companies/${companyDoc.id}/taxObligations`));
          const obligationsSnapshot = await getDocs(obligationsQuery);
          obligationsSnapshot.forEach((doc) => {
            const obligation = doc.data() as TaxObligation;
            if (statusCounts[obligation.status] !== undefined) {
              statusCounts[obligation.status]++;
            }
          });
        }

        const chartData = Object.keys(statusCounts)
          .map((status) => ({
            status,
            count: statusCounts[status],
            fill: `var(--color-${status.replace(/\s/g, '')})`,
          }))
          .filter((item) => item.count > 0);

        setData(chartData);
      } catch (error) {
        console.error('Error fetching obligation data for chart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore]);

  const totalObligations = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);
  
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  return (
     <ChartContainer config={chartConfig} className="min-h-[200px] w-full max-w-xs mx-auto">
      <PieChart accessibilityLayer>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={60}
          strokeWidth={5}
          labelLine={false}
          label={({
            cx,
            cy,
            midAngle,
            innerRadius,
            outerRadius,
            value,
            index,
          }) => {
            const RADIAN = Math.PI / 180
            const radius = 12 + innerRadius + (outerRadius - innerRadius)
            const x = cx + radius * Math.cos(-midAngle * RADIAN)
            const y = cy + radius * Math.sin(-midAngle * RADIAN)

            return (
              <text
                x={x}
                y={y}
                className="fill-muted-foreground text-xs"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
              >
                {data[index].status} ({value})
              </text>
            )
          }}
        >
           {data.map((entry) => (
             <Cell key={`cell-${entry.status}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
