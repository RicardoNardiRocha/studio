'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FiscalDocumentsTable } from './fiscal-documents-table';
import { FiscalControlTab } from './fiscal-control-tab';
import { Badge } from '@/components/ui/badge';
import { UploadFiscalDocumentDialog } from '@/components/fiscal/upload-fiscal-document-dialog';
import { FiscalDocumentDetailsDialog } from '@/components/fiscal/fiscal-document-details-dialog';

// Define the shape of a fiscal document
export type FiscalDocument = {
  id: string;
  companyName: string;
  companyCnpj: string;
  documentType: 'Livro de Entrada' | 'Livro de Saída' | 'Nota Fiscal';
  status: 'Ativa' | 'Cancelada' | 'Inutilizada' | 'Denegada' | 'Rejeitada';
  uploadedAt: string; // ISO string date
  fileUrl: string;
  competencia: string; // Mês/Ano de referência do livro
};

const documentStatuses: Array<'Todos' | FiscalDocument['status']> = ['Todos', 'Ativa', 'Cancelada', 'Inutilizada', 'Denegada', 'Rejeitada'];

export function FiscalClient() {
  const [activeTab, setActiveTab] = useState('controle');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<FiscalDocument | null>(null);

  const firestore = useFirestore();

  const fiscalDocumentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'fiscalDocuments'), orderBy('uploadedAt', 'desc'));
  }, [firestore]);

  const { data: documents, isLoading, forceRefetch } = useCollection<FiscalDocument>(fiscalDocumentsQuery);

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    return documents.filter(doc => {
      const companyMatch = doc.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'Todos' || doc.status === statusFilter;
      return companyMatch && statusMatch;
    });
  }, [documents, searchTerm, statusFilter]);

  const entradaDocuments = useMemo(() => filteredDocuments.filter(doc => doc.documentType === 'Livro de Entrada'), [filteredDocuments]);
  const saidaDocuments = useMemo(() => filteredDocuments.filter(doc => doc.documentType === 'Livro de Saída'), [filteredDocuments]);

  const cardDescription = activeTab === 'controle'
    ? 'Monitore o envio de arquivos XML para a geração dos livros de saída.'
    : 'Gerencie os livros de entrada, saída e notas fiscais.';

  const handleAction = () => {
    forceRefetch();
    setIsUploadOpen(false);
    setSelectedDocument(null);
  };

  return (
    <>
      <UploadFiscalDocumentDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} onUploadComplete={handleAction} />
      {selectedDocument && (
        <FiscalDocumentDetailsDialog document={selectedDocument} open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)} />
      )}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
              <div className="flex items-center gap-2">
                   <CardTitle className="font-headline">Documentos Fiscais</CardTitle>
                  {documents && (
                    <Badge variant="secondary">{documents.length}</Badge>
                  )}
              </div>
            <CardDescription>{cardDescription}</CardDescription>
          </div>
          {activeTab !== 'controle' && (
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="controle" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="controle">Controle</TabsTrigger>
              <TabsTrigger value="saida">Saída</TabsTrigger>
              <TabsTrigger value="entrada">Entrada</TabsTrigger>
            </TabsList>

            {activeTab !== 'controle' && (
              <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
                <div className="relative w-full md:flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por empresa..."
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-auto md:min-w-[200px]">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {documentStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <TabsContent value="controle">
              <FiscalControlTab />
            </TabsContent>
            <TabsContent value="saida">
              <FiscalDocumentsTable documents={saidaDocuments} isLoading={isLoading} onSelectDocument={setSelectedDocument} />
            </TabsContent>
            <TabsContent value="entrada">
              <FiscalDocumentsTable documents={entradaDocuments} isLoading={isLoading} onSelectDocument={setSelectedDocument} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
