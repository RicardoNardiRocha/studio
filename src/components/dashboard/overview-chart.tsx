'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { overviewChartData } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function OverviewChart() {
  return (
    <ChartContainer config={chartConfig} className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={overviewChartData} accessibilityLayer>
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${value / 1000}k`}
          />
          <Tooltip
              cursor={{fill: 'hsl(var(--secondary))', radius: 'var(--radius)'}}
              content={<ChartTooltipContent
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
              />}
          />
          <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
