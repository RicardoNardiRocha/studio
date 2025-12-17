'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRef } from "react";
import type { Obligation } from "./obligations-table"; // Importando o tipo

// Dados de exemplo para histórico e documentos, que ainda serão buscados no futuro
const mockHistory = [
    { user: 'Mariana', date: '14/07/2024', action: 'Status alterado para Em Andamento'},
    { user: 'João', date: '15/07/2024', action: 'Documento anexo: guia_das.pdf'},
    { user: 'João', date: '15/07/2024', action: 'Status alterado para Entregue'}
];
const mockDocuments = [
    { name: 'guia_das.pdf', user: 'João', date: '15/07/2024', url: '#'},
    { name: 'comprovante.pdf', user: 'João', date: '15/07/2024', url: '#'}
];

const statusVariant = {
  delivered: 'success',
  pending: 'warning',
  overdue: 'destructive',
} as const;

interface ObligationDetailsDialogProps {
  obligation: Obligation; // A obrigação é agora uma propriedade obrigatória
}

export function ObligationDetailsDialog({ obligation }: ObligationDetailsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("Nenhum arquivo selecionado.");
      return;
    }

    console.log("Arquivo selecionado:", file.name);
    // A lógica de upload real será implementada aqui
    alert(`Upload do arquivo ${file.name} ainda não implementado.`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Ver Detalhes</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Obrigação: {obligation.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
                <Tabs defaultValue="documents">
                    <TabsList>
                        <TabsTrigger value="documents">Documentos</TabsTrigger>
                        <TabsTrigger value="history">Histórico</TabsTrigger>
                        <TabsTrigger value="notes">Observações</TabsTrigger>
                    </TabsList>
                    <TabsContent value="documents">
                         <div className="flex items-center justify-between mt-4 mb-2">
                            <h4 className="font-semibold">Documentos Anexados</h4>
                            <Button size="sm" onClick={handleAttachFileClick}>Anexar Arquivo</Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelected}
                                className="hidden"
                            />
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Arquivo</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockDocuments.map(doc => (
                                    <TableRow key={doc.name}>
                                        <TableCell>{doc.name}</TableCell>
                                        <TableCell>{doc.user}</TableCell>
                                        <TableCell>{doc.date}</TableCell>
                                        <TableCell><Button variant="link" size="sm" onClick={() => window.open(doc.url, '_blank')}>Baixar</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                    <TabsContent value="history">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockHistory.map(entry => (
                                    <TableRow key={entry.date + entry.action}>
                                        <TableCell>{entry.user}</TableCell>
                                        <TableCell>{entry.date}</TableCell>
                                        <TableCell>{entry.action}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                    <TabsContent value="notes">
                        <Textarea placeholder="Adicione observações internas aqui..." className="mt-4"/>
                         <div className="flex justify-end mt-2">
                           <Button size="sm">Salvar Observação</Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            <div className="space-y-4">
                 <h4 className="font-semibold">Informações Gerais</h4>
                 <p><strong>Empresa:</strong> {obligation.companyName}</p>
                 <p><strong>Responsável:</strong> {obligation.responsibleName}</p>
                 <p><strong>Periodicidade:</strong> Mensal</p> {/* TODO: Adicionar campo no Firestore */}
                 <p><strong>Vencimento:</strong> {obligation.dueDate}</p>
                 <div className="flex items-center gap-2">
                    <strong>Status:</strong> <Badge variant={statusVariant[obligation.status]}>{obligation.status}</Badge>
                 </div>
                 <Select defaultValue={obligation.status}>
                    <SelectTrigger>
                        <SelectValue placeholder="Alterar Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="overdue">Atrasada</SelectItem>
                    </SelectContent>
                 </Select>
                 <Button className="w-full">Salvar Alterações</Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
