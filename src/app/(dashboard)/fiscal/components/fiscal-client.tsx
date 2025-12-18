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
import { Upload, Search, Settings } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FiscalDocumentsTable } from './fiscal-documents-table';
import { FiscalControlTab } from './fiscal-control-tab';
import { Badge } from '@/components/ui/badge';
import { UploadFiscalDocumentDialog } from '@/components/fiscal/upload-fiscal-document-dialog';
import { FiscalDocumentDetailsDialog } from '@/components/fiscal/fiscal-document-details-dialog';
import { ConfigureXmlCompaniesDialog } from './configure-xml-companies-dialog';

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
const rejectedStatuses: FiscalDocument['status'][] = ['Cancelada', 'Denegada', 'Inutilizada', 'Rejeitada'];

export function FiscalClient() {
  const [activeTab, setActiveTab] = useState('controle');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
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

  // Documentos para a nova aba de Notas com pendência
  const rejectedSaidaNotes = useMemo(() => {
      if (!documents) return [];
      return documents.filter(doc => doc.documentType === 'Nota Fiscal' && doc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) && rejectedStatuses.includes(doc.status));
  }, [documents, searchTerm]);
  
  const rejectedEntradaNotes = useMemo(() => {
       if (!documents) return [];
      return documents.filter(doc => doc.documentType === 'Nota Fiscal' && doc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) && rejectedStatuses.includes(doc.status));
  }, [documents, searchTerm]);


  const getCardDescription = () => {
    switch (activeTab) {
      case 'controle':
        return 'Monitore o envio de arquivos XML para a geração dos livros de saída.';
      case 'saida':
      case 'entrada':
        return 'Gerencie os livros de entrada, saída e notas fiscais.';
      case 'notas':
        return 'Visualize notas fiscais com status de Cancelada, Denegada, Inutilizada ou Rejeitada.';
      default:
        return '';
    }
  };

  const handleAction = () => {
    forceRefetch();
    setIsUploadOpen(false);
    setIsConfigureOpen(false);
    setSelectedDocument(null);
  };

  return (
    <>
      <UploadFiscalDocumentDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} onUploadComplete={handleAction} />
      <ConfigureXmlCompaniesDialog open={isConfigureOpen} onOpenChange={setIsConfigureOpen} onSave={handleAction} />
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
            <CardDescription>{getCardDescription()}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
             {activeTab === 'controle' && (
                <Button onClick={() => setIsConfigureOpen(true)} variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Empresas
                </Button>
            )}
            <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Enviar Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="controle" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="controle">Controle</TabsTrigger>
              <TabsTrigger value="saida">Livros de Saída</TabsTrigger>
              <TabsTrigger value="entrada">Livros de Entrada</TabsTrigger>
              <TabsTrigger value="notas">Notas Fiscais</TabsTrigger>
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
                {activeTab !== 'notas' && (
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
                )}
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
             <TabsContent value="notas">
                <Tabs defaultValue="saida_notas" className="mt-4">
                    <TabsList>
                        <TabsTrigger value="saida_notas">Notas de Saída</TabsTrigger>
                        <TabsTrigger value="entrada_notas">Notas de Entrada</TabsTrigger>
                    </TabsList>
                    <TabsContent value="saida_notas">
                         <FiscalDocumentsTable documents={rejectedSaidaNotes} isLoading={isLoading} onSelectDocument={setSelectedDocument} />
                    </TabsContent>
                     <TabsContent value="entrada_notas">
                         <FiscalDocumentsTable documents={rejectedEntradaNotes} isLoading={isLoading} onSelectDocument={setSelectedDocument} />
                    </TabsContent>
                </Tabs>
             </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
