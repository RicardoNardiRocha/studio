'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Download, Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { AddDocumentDialog } from './add-document-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

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

const documentTypes = ['Todos', 'Contrato Social', 'Alvará', 'Certidão Negativa', 'Procuração', 'Documento Fiscal', 'Outro'];

export function DocumentsClient() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!firestore) return;
    setIsLoading(true);
    const allDocuments: Document[] = [];
    try {
      const companiesSnapshot = await getDocs(collection(firestore, 'companies'));

      for (const companyDoc of companiesSnapshot.docs) {
        const q = query(collection(firestore, `companies/${companyDoc.id}/documents`), orderBy('uploadDate', 'desc'));
        const documentsSnapshot = await getDocs(q);
        documentsSnapshot.forEach(doc => {
          allDocuments.push({ id: doc.id, ...doc.data() } as Document);
        });
      }
      setDocuments(allDocuments);
    } catch(e) {
        console.error("Error fetching documents: ", e);
        toast({ title: "Erro ao buscar documentos", description: "Não foi possível carregar os dados. Verifique suas permissões.", variant: "destructive"});
    } finally {
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDocuments();
  }, [firestore]);

  const handleAction = () => {
    fetchDocuments();
  };

  const handleDelete = async (docToDelete: Document) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'companies', docToDelete.companyId, 'documents', docToDelete.id));
      toast({ title: "Documento excluído com sucesso!" });
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({ title: "Erro ao excluir documento", variant: "destructive" });
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
        const searchMatch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const typeMatch = typeFilter === 'Todos' || d.type === typeFilter;
        return searchMatch && typeMatch;
    });
  }, [documents, searchTerm, typeFilter]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date.seconds * 1000);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <>
      <AddDocumentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onDocumentAdded={handleAction}
      />
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="font-headline">
              Repositório de Documentos
            </CardTitle>
            <CardDescription>
              Armazene e gerencie todos os documentos de clientes e internos.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full mt-4 md:mt-0 md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Fazer Upload
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do arquivo ou empresa..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto md:min-w-[180px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type === 'Todos' ? 'Todos os Tipos' : type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Upload</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>{doc.companyName}</TableCell>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}