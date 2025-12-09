'use client';

import { useMemo } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

interface CorporateProcess {
  processType: string;
  status: string;
}

const COLORS: Record<string, string> = {
  Abertura: 'hsl(var(--chart-1))',
  Alteracao: 'hsl(var(--chart-2))',
  Encerramento: 'hsl(var(--chart-3))',
  Outro: 'hsl(var(--muted))',
};

export function ProcessesByTypeChart() {
  const firestore = useFirestore();

  const processesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'corporateProcesses'));
  }, [firestore]);

  const { data: processes, isLoading } = useCollection<CorporateProcess>(processesQuery);

  const chartData = useMemo(() => {
    if (!processes) return null;

    const counts: Record<string, number> = {
      Abertura: 0,
      Alteracao: 0,
      Encerramento: 0,
    };
    
    const activeStatuses = ['Aguardando Documentação', 'Em Análise', 'Em Exigência'];

    for (const proc of processes) {
      let type = proc.processType || 'Outro';
      if (type === 'Alteração') type = 'Alteracao';
      if (!Object.prototype.hasOwnProperty.call(counts, type)) {
         counts[type] = counts[type] ?? 0;
      }
      if (activeStatuses.includes(proc.status) && counts[type] !== undefined) {
        counts[type]++;
      }
    }

    return Object.keys(counts).map((key) => ({
      key,
      label: key === 'Alteracao' ? 'Alteração' : key,
      count: counts[key],
      color: COLORS[key] || 'hsl(var(--muted))',
    }));
  }, [processes]);


  if (isLoading) return <Skeleton className="h-[180px] w-full" />;

  if (!chartData || chartData.length === 0 || chartData.every(d => d.count === 0)) {
    return (
      <div className="flex h-[180px] items-center justify-center">
        <p className="text-muted-foreground">Nenhum processo em andamento.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" dataKey="count" />
          <YAxis type="category" dataKey="label" width={140} />
          <Tooltip
            formatter={(value: any, name: string, props: any) => [value, 'Processos']}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="count" barSize={22} radius={6}>
            {chartData.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
