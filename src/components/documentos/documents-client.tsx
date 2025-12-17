'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, FileText } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collectionGroup, query, getDocs, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';

interface UnifiedDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
  module: 'Empresa' | 'Processo' | 'Obrigação' | 'Fiscal';
  relatedTo: string; // e.g., Company Name, Process Type
}

export function DocumentsClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allDocuments, setAllDocuments] = useState<UnifiedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile } = useUser();

  useEffect(() => {
    const fetchAllDocuments = async () => {
      if (!firestore) return;
      setIsLoading(true);

      const collectedDocs: UnifiedDocument[] = [];

      try {
        // Query 1: Documents from companies/{companyId}/documents
        const companyDocsQuery = query(collectionGroup(firestore, 'documents'));
        const companyDocsSnap = await getDocs(companyDocsQuery);
        companyDocsSnap.forEach(doc => {
          const data = doc.data();
          collectedDocs.push({
            id: doc.id,
            name: data.fileName || data.name,
            url: data.fileUrl,
            uploadedAt: data.uploadDate instanceof Timestamp ? data.uploadDate.toDate() : new Date(data.uploadDate),
            uploadedBy: data.responsibleUserName,
            module: 'Empresa',
            relatedTo: data.companyName,
          });
        });

        // Query 2: Attachments from corporateProcesses
        const processAttachmentsQuery = query(collectionGroup(firestore, 'attachments'));
        const processAttachmentsSnap = await getDocs(processAttachmentsQuery);
        processAttachmentsSnap.forEach(doc => {
           const data = doc.data();
           const pathSegments = doc.ref.path.split('/');
           // Ensure it's a process attachment
           if (pathSegments.includes('corporateProcesses')) {
                collectedDocs.push({
                    id: doc.id,
                    name: data.name,
                    url: data.url,
                    uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
                    uploadedBy: data.uploadedBy,
                    module: 'Processo',
                    relatedTo: `Processo ID: ${pathSegments[pathSegments.indexOf('corporateProcesses') + 1]}`,
                });
           }
            if (pathSegments.includes('taxObligations')) {
                 collectedDocs.push({
                    id: doc.id,
                    name: data.name,
                    url: data.url,
                    uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
                    uploadedBy: data.uploadedBy,
                    module: 'Obrigação',
                    relatedTo: `Obrigação ID: ${pathSegments[pathSegments.indexOf('taxObligations') + 1]}`,
                });
           }
        });
        
        // Query 3: fiscalDocuments (root collection)
        const fiscalDocsQuery = query(collectionGroup(firestore, 'fiscalDocuments'));
        const fiscalDocsSnap = await getDocs(fiscalDocsQuery);
        fiscalDocsSnap.forEach(doc => {
            const data = doc.data();
             collectedDocs.push({
                id: doc.id,
                name: `${data.documentType} - ${data.competencia}.xml`,
                url: data.fileUrl,
                uploadedAt: new Date(data.uploadedAt),
                uploadedBy: 'Sistema',
                module: 'Fiscal',
                relatedTo: data.companyName,
             });
        })

        // Sort all documents by date, most recent first
        collectedDocs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
        setAllDocuments(collectedDocs);

      } catch (error) {
        console.error("Error fetching all documents:", error);
        toast({ title: "Erro ao buscar documentos", description: "Não foi possível carregar os arquivos de todos os módulos.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDocuments();
  }, [firestore, toast]);
  

  const filteredDocuments = useMemo(() => {
    if (!allDocuments) return [];
    return allDocuments.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.relatedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.module.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allDocuments, searchTerm]);

  const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  if (!profile?.permissions.documentos.read) {
    return (
      <Card className='bg-destructive/10 border-destructive'>
        <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription className='text-destructive-foreground'>
                Você não tem permissão para visualizar este módulo.
            </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Repositório Central de Documentos</CardTitle>
        <CardDescription>
          Visualize e acesse todos os documentos e anexos do sistema em um único lugar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <div className="relative w-full flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do arquivo, módulo ou entidade relacionada..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'></TableHead>
                <TableHead>Nome do Arquivo</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Relacionado a</TableHead>
                <TableHead>Data de Upload</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id + doc.url}>
                    <TableCell><FileText className="h-4 w-4 text-muted-foreground" /></TableCell>
                    <TableCell className="font-medium truncate max-w-xs">{doc.name}</TableCell>
                    <TableCell><Badge variant="secondary">{doc.module}</Badge></TableCell>
                    <TableCell className="truncate max-w-xs">{doc.relatedTo}</TableCell>
                    <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" asChild>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" download={doc.name}>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Baixar</span>
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum documento encontrado no sistema.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
