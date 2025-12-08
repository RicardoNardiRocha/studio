'use client';

import { Bar, BarChart, CartesianGrid, XAxis, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
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
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';

interface CorporateProcess {
  processType: 'Abertura' | 'Alteração' | 'Encerramento' | 'Outro';
  status: string;
}

const chartConfig = {
  count: {
    label: 'Processos',
  },
  Abertura: {
    label: 'Abertura',
    color: 'hsl(var(--chart-1))',
  },
  Alteração: {
    label: 'Alteração',
    color: 'hsl(var(--chart-2))',
  },
  Encerramento: {
    label: 'Encerramento',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function ProcessesByTypeChart() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchData = async () => {
      if (!firestore) return;
      setIsLoading(true);
      const processCounts: Record<string, number> = {
        Abertura: 0,
        Alteração: 0,
        Encerramento: 0,
      };

      try {
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));
        for (const companyDoc of companiesSnapshot.docs) {
          const processesQuery = query(
            collection(firestore, `companies/${companyDoc.id}/corporateProcesses`),
             where('status', 'in', ['Aguardando Documentação', 'Em Análise', 'Em Exigência'])
          );
          const processesSnapshot = await getDocs(processesQuery);
          processesSnapshot.forEach((doc) => {
            const process = doc.data() as CorporateProcess;
            if (processCounts[process.processType] !== undefined) {
              processCounts[process.processType]++;
            }
          });
        }

        const chartData = Object.keys(processCounts).map((type) => ({
          type,
          count: processCounts[type],
          fill: `var(--color-${type})`,
        }));

        setData(chartData);
      } catch (error) {
        console.error('Error fetching process data for chart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore]);
  
  if (isLoading) {
    return <Skeleton className="h-[150px] w-full" />;
  }
  
  if (data.every(d => d.count === 0)) {
     return (
        <div className="flex h-[150px] w-full items-center justify-center">
            <p className="text-muted-foreground">Nenhum processo em andamento.</p>
        </div>
     )
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-[150px]">
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" dataKey="count" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="count" layout="vertical" radius={5}>
            {data.map(item => (
                <Cell key={item.type} fill={item.fill} />
            ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
