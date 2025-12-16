"use client";

import { useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - replace with actual data from your backend
const mockData = {
  companies: [
    { id: "1", name: "Empresa Alpha", status: "in_day", regime: "simples", responsible: "João", documents: 25 },
    { id: "2", name: "Empresa Beta", status: "pending", regime: "lucro_presumido", responsible: "Maria", documents: 42 },
    { id: "3", name: "Empresa Gamma", status: "attention", regime: "simples", responsible: "João", documents: 15 },
    { id: "4", name: "Empresa Delta", status: "conference", regime: "lucro_real", responsible: "Ana", documents: 89 },
    { id: "5", name: "Empresa Epsilon", status: "no_movement", regime: "simples", responsible: "Carlos", documents: 0 },
  ],
  documentTypes: ["NFS-e", "NFC-e", "NF-e", "CT-e"],
  fiscalStatus: [
    { value: "in_day", label: "Em dia" },
    { value: "pending", label: "Pendente" },
    { value: "attention", label: "Atenção" },
    { value: "conference", label: "Em conferência" },
    { value: "no_movement", label: "Sem movimento" },
  ],
  responsibles: ["João", "Maria", "Ana", "Carlos"],
};

// Types and Column Definitions for DataTable
export type Company = {
  id: string;
  name: string;
  status: "in_day" | "pending" | "attention" | "conference" | "no_movement";
  regime: "simples" | "lucro_presumido" | "lucro_real";
  responsible: string;
  documents: number;
};

const statusHelper = {
  in_day: { label: "Em dia", color: "bg-green-500" },
  pending: { label: "Pendente", color: "bg-red-500" },
  attention: { label: "Atenção", color: "bg-yellow-500" },
  conference: { label: "Em conferência", color: "bg-blue-500" },
  no_movement: { label: "Sem movimento", color: "bg-gray-500" },
};

export const columns: ColumnDef<Company>[] = [
  { accessorKey: "name", header: "Empresa" },
  {
    accessorKey: "status",
    header: "Situação",
    cell: ({ row }) => {
      const status = row.getValue("status") as Company["status"];
      const { label, color } = statusHelper[status];
      return <div className="flex items-center"><span className={`w-2 h-2 rounded-full mr-2 ${color}`}></span>{label}</div>;
    },
  },
  {
    accessorKey: "regime",
    header: "Regime",
    cell: ({ row }) => {
      const regime = row.getValue("regime") as Company["regime"];
      const labels = { simples: "Simples Nacional", lucro_presumido: "Lucro Presumido", lucro_real: "Lucro Real" };
      return <span>{labels[regime]}</span>;
    },
  },
  { accessorKey: "documents", header: "Documentos" },
  { accessorKey: "responsible", header: "Responsável" },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>Copiar ID</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
          <DropdownMenuItem>Marcar como revisado</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// Generic DataTable Component
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Próximo
        </Button>
      </div>
    </div>
  );
}

const statusClasses = {
  in_day: { bg: "bg-green-100", border: "border-green-500", text: "text-green-800", indicator: "bg-green-500" },
  pending: { bg: "bg-red-100", border: "border-red-500", text: "text-red-800", indicator: "bg-red-500" },
  attention: { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-800", indicator: "bg-yellow-500" },
  conference: { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-800", indicator: "bg-blue-500" },
  no_movement: { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-800", indicator: "bg-gray-500" },
};

// Main Fiscal Client Component
export function FiscalClient() {
  const [view, setView] = useState("overview");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Filters state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterDocType, setFilterDocType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRegime, setFilterRegime] = useState("");
  const [filterResponsible, setFilterResponsible] = useState("");

  const handleClearFilters = () => {
    setFilterCompany("");
    setFilterDocType("");
    setFilterStatus("");
    setFilterRegime("");
    setFilterResponsible("");
    setSearchTerm("");
  };

  const filteredCompanies = mockData.companies.filter(c => {
    if (filterCompany && c.id !== filterCompany) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterRegime && c.regime !== filterRegime) return false;
    if (filterResponsible && c.responsible !== filterResponsible) return false;
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const renderContent = () => {
    if (view === 'overview') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCompanies.map(company => {
            const statusInfo = statusClasses[company.status];
            return (
              <Card key={company.id} className={`cursor-pointer hover:shadow-lg transition-shadow ${statusInfo.bg} ${statusInfo.border}`} onClick={() => setSelectedCompany(company)}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className={statusInfo.text}>{company.name}</span>
                    <span className={`w-3 h-3 rounded-full ${statusInfo.indicator}`}></span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={statusInfo.text}>
                  <p>Competência: {selectedMonth}/{selectedYear}</p>
                  <p>Situação: {statusHelper[company.status].label}</p>
                  <p>Documentos: {company.documents}</p>
                  {company.status === 'pending' && <p className="font-bold">Pendências: 3</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )
    } else {
        // You might want to have different columns for "by_doc"
        return <DataTable columns={columns} data={filteredCompanies} />
    }
  }

  return (
    <div className="flex h-full bg-background">
      <aside className="w-64 flex-shrink-0 border-r p-4 space-y-4">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>{mockData.companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterDocType} onValueChange={setFilterDocType}>
          <SelectTrigger><SelectValue placeholder="Tipo de Documento" /></SelectTrigger>
          <SelectContent>{mockData.documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger><SelectValue placeholder="Situação Fiscal" /></SelectTrigger>
          <SelectContent>{mockData.fiscalStatus.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterRegime} onValueChange={setFilterRegime}>
          <SelectTrigger><SelectValue placeholder="Regime da Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="simples">Simples Nacional</SelectItem>
            <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
            <SelectItem value="lucro_real">Lucro Real</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterResponsible} onValueChange={setFilterResponsible}>
          <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>{mockData.responsibles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        <Button className="w-full" onClick={() => alert("Filtros aplicados!")}>Aplicar Filtros</Button>
        <Button className="w-full" variant="outline" onClick={handleClearFilters}>Limpar Filtros</Button>
      </aside>

      <main className="flex-1 p-6">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Select defaultValue={String(selectedMonth)} onValueChange={val => setSelectedMonth(Number(val))}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select defaultValue={String(selectedYear)} onValueChange={val => setSelectedYear(Number(val))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => <SelectItem key={i} value={String(new Date().getFullYear() - i)}>{new Date().getFullYear() - i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Buscar por empresa ou documento..." className="w-[300px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant={view === 'overview' ? 'default' : 'outline'} onClick={() => setView('overview')}>Visão Geral</Button>
            <Button variant={view === 'by_company' ? 'default' : 'outline'} onClick={() => setView('by_company')}>Por Empresa</Button>
            <Button variant={view === 'by_doc' ? 'default' : 'outline'} onClick={() => setView('by_doc')}>Por Documento</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader><CardTitle>Empresas em Dia</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-green-600">{mockData.companies.filter(c => c.status === 'in_day').length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Empresas com Pendências</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-red-600">{mockData.companies.filter(c => c.status === 'pending').length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Documentos no Mês</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{mockData.companies.reduce((acc, c) => acc + c.documents, 0)}</p></CardContent>
          </Card>
        </div>

        {renderContent()}
      </main>

      <Sheet open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalhes Fiscais - {selectedCompany?.name}</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <h4 className="font-semibold mb-2">Documentos Fiscais ({selectedMonth}/{selectedYear})</h4>
            <ul>
              <li>NF-e 12345 - Conferido</li>
              <li>NF-e 12346 - Pendente</li>
              <li>NFS-e 789 - Revisado</li>
            </ul>
            <div className="mt-4">
              <h4 className="font-semibold">Ações</h4>
              <div className="flex space-x-2 mt-2">
                <Button size="sm">Conferir Documento</Button>
                <Button size="sm" variant="outline">Anexar Arquivo</Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
