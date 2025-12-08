'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

interface CorporateProcess {
  processType: string; // pode vir "Abertura", "Alteração", "Encerramento" etc
  status: string;
}

const COLORS: Record<string, string> = {
  Abertura: 'hsl(var(--chart-1))',
  Alteracao: 'hsl(var(--chart-2))',
  Encerramento: 'hsl(var(--chart-3))',
  Outro: 'hsl(var(--muted))',
};

export function ProcessesByTypeChart() {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchData = async () => {
      if (!firestore) return;
      setIsLoading(true);

      // inicializa contadores (usar chaves sem acento pra consistência)
      const counts: Record<string, number> = {
        Abertura: 0,
        Alteracao: 0,
        Encerramento: 0,
      };

      const activeStatuses = ['Aguardando Documentação', 'Em Análise', 'Em Exigência'];

      try {
        const companiesSnap = await getDocs(collection(firestore, 'companies'));

        for (const companyDoc of companiesSnap.docs) {
          const processesSnap = await getDocs(query(collection(firestore, `companies/${companyDoc.id}/corporateProcesses`)));
          processesSnap.forEach((p) => {
            const proc = p.data() as CorporateProcess;
            // normalizar processType para chave sem acento
            let type = proc.processType || 'Outro';
            if (type === 'Alteração') type = 'Alteracao';
            if (!Object.prototype.hasOwnProperty.call(counts, type)) {
              // opcional: adicionar novos tipos dinamicamente
              counts[type] = counts[type] ?? 0;
            }
            if (activeStatuses.includes(proc.status) && counts[type] !== undefined) {
              counts[type]++;
            }
          });
        }

        // console.log para debug — remova em produção
        console.log('processCounts:', counts);

        // monta array com label (legível) e count
        const chartData = Object.keys(counts).map((key) => ({
          key,                 // 'Abertura' | 'Alteracao' | 'Encerramento'
          label: key === 'Alteracao' ? 'Alteração' : key,
          count: counts[key],
          color: COLORS[key] || 'hsl(var(--muted))',
        }));

        setData(chartData);
      } catch (err) {
        console.error('Erro ao buscar processos:', err);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore]);

  if (isLoading) return <Skeleton className="h-[180px] w-full" />;

  if (!data || data.length === 0 || data.every(d => d.count === 0)) {
    return (
      <div className="flex h-[180px] items-center justify-center">
        <p className="text-muted-foreground">Nenhum processo em andamento.</p>
      </div>
    );
  }

  return (
    // ResponsiveContainer mantém tamanho correto no layout do dashboard
    <div className="w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          {/* XAxis é o eixo numérico */}
          <XAxis type="number" dataKey="count" />
          {/* YAxis é o eixo de categorias */}
          <YAxis type="category" dataKey="label" width={140} />
          <Tooltip
            formatter={(value: any, name: string, props: any) => [value, 'Processos']}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="count" barSize={22} radius={6}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
