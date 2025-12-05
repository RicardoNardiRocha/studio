'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Search, Download, Trash2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AddDocumentDialog } from '../documentos/add-document-dialog';
import type { Company } from './company-details-dialog';

interface CompanyDocumentsTabProps {
  company: Company;
}

export interface Document {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  type: string;
  uploadDate: { seconds: number; nanoseconds: number } | Date;
  expirationDate?: { seconds: number; nanoseconds: number } | Date | null;
  responsibleUserId: string;
  responsibleUserName: string;
  fileUrl: string;
}

export function CompanyDocumentsTab({ company }: CompanyDocumentsTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies', company.id, 'documents'), orderBy('uploadDate', 'desc'));
  }, [firestore, company.id]);

  const { data: documents, isLoading, error } = useCollection<Document>(documentsQuery);
  
  const handleAction = () => {
    // A revalidação é feita automaticamente pelo useCollection
    setIsAddDialogOpen(false);
  };
  
  const handleDelete = async (docToDelete: Document) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'companies', docToDelete.companyId, 'documents', docToDelete.id));
      toast({ title: "Documento excluído com sucesso!" });
      // A revalidação é feita automaticamente pelo useCollection
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({ title: "Erro ao excluir documento", variant: "destructive" });
    }
  };

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    return documents.filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <>
      <AddDocumentDialog
        company={company}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onDocumentAdded={handleAction}
      />
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do arquivo ou tipo..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Fazer Upload
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Arquivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data de Upload</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDocuments && filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell><Badge variant="secondary">{doc.type}</Badge></TableCell>
                    <TableCell>{formatDate(doc.uploadDate)}</TableCell>
                    <TableCell>{formatDate(doc.expirationDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Baixar</span>
                        </a>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="ml-2 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso irá excluir permanentemente o documento
                              <strong> {doc.name}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(doc)} className="bg-destructive hover:bg-destructive/90">
                              Sim, excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum documento encontrado para esta empresa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
