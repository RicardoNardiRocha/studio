'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { obligations as initialObligations, obligationStatusOptions } from '@/lib/data';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'gerar': return 'bg-gray-500';
    case 'conferir': return 'bg-blue-500';
    case 'protocolar': return 'bg-purple-500';
    case 'enviar': return 'bg-yellow-500 text-black';
    case 'arquivar': return 'bg-indigo-500';
    case 'entregar': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
};

export function ObligationsTable() {
  const [obligations, setObligations] = useState(initialObligations);
  const [filter, setFilter] = useState('Todos');

  const handleStatusChange = (id: string, newStatus: string) => {
    setObligations((prev) =>
      prev.map((ob) => (ob.id === id ? { ...ob, status: newStatus } : ob))
    );
  };

  const filteredObligations =
    filter === 'Todos'
      ? obligations
      : obligations.filter((ob) => ob.sector === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="Todos" onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="Todos">Todos</TabsTrigger>
            <TabsTrigger value="Fiscal">Fiscal</TabsTrigger>
            <TabsTrigger value="DP">DP</TabsTrigger>
            <TabsTrigger value="Contábil">Contábil</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Obrigação</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="w-[200px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredObligations.map((ob) => (
              <TableRow key={ob.id}>
                <TableCell className="font-medium">{ob.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ob.sector}</Badge>
                </TableCell>
                <TableCell>{ob.due}</TableCell>
                <TableCell>{ob.assignee}</TableCell>
                <TableCell>
                  <Select
                    value={ob.status}
                    onValueChange={(newStatus) => handleStatusChange(ob.id, newStatus)}
                  >
                    <SelectTrigger className={`w-full text-white ${getStatusColor(ob.status)}`}>
                      <SelectValue placeholder="Mudar status" />
                    </SelectTrigger>
                    <SelectContent>
                      {obligationStatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                             <span className={`h-2 w-2 rounded-full ${getStatusColor(opt.value)}`} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
