'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FiscalDocument } from '@/app/(dashboard)/fiscal/components/fiscal-client';
import { Download, FileText, Loader2, Send, Trash2, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useCollection, useFirestore, useUser, useMemoFirebase, useStorage } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { logActivity } from '@/lib/activity-log';
import { ref, deleteObject } from 'firebase/storage';


interface FiscalDocumentDetailsDialogProps {
  document: FiscalDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

interface Note {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  createdAt: any;
}


function NotesTab({ document }: { document: FiscalDocument }) {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const notesQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, `fiscalDocuments/${document.id}/notes`), orderBy('createdAt', 'asc')) : null,
    [firestore, document.id]
  );
  const { data: notes, isLoading: isLoadingNotes } = useCollection<Note>(notesQuery);

  const handleAddNote = async () => {
    if (!firestore || !user || !newNote.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, `fiscalDocuments/${document.id}/notes`), {
        text: newNote,
        userId: user.uid,
        userName: user.displayName,
        userAvatarUrl: user.photoURL || '',
        createdAt: serverTimestamp(),
      });
      setNewNote('');
      toast({ title: 'Nota adicionada com sucesso!' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao adicionar nota.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleDeleteNote = async (noteId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, `fiscalDocuments/${document.id}/notes`, noteId));
      toast({ title: "Nota excluída." });
    } catch (error) {
      toast({ title: "Erro ao excluir nota.", variant: "destructive" });
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ptBR });
  };


  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium">Adicionar Nota</h4>
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Digite sua observação aqui..."
          rows={3}
        />
        <Button onClick={handleAddNote} disabled={isSubmitting || !newNote.trim()}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Salvar Nota
        </Button>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Histórico de Notas</h4>
        <ScrollArea className="h-48 w-full rounded-md border p-4">
          {isLoadingNotes ? (
             Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)
          ) : notes && notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map(note => (
                <div key={note.id} className="flex items-start gap-3">
                   <Avatar className="h-8 w-8">
                      <AvatarImage src={note.userAvatarUrl} alt={note.userName} />
                      <AvatarFallback>{note.userName?.charAt(0) || <User />}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold">{note.userName}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{formatTimestamp(note.createdAt)}</p>
                             {user?.uid === note.userId && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteNote(note.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <p className="mt-1">{note.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Nenhuma nota adicionada ainda.
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export function FiscalDocumentDetailsDialog({ document, open, onOpenChange, onDelete }: FiscalDocumentDetailsDialogProps) {
    const { profile, user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const getStatusVariant = (status: FiscalDocument['status']): 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined => {
        switch (status) {
        case 'Ativa': return 'default';
        case 'Cancelada': return 'destructive';
        case 'Inutilizada': return 'secondary';
        case 'Denegada': return 'destructive';
        case 'Rejeitada': return 'outline';
        default: return 'secondary';
        }
    };

    const handleDelete = async () => {
        if (!firestore || !storage || !user) {
            toast({ title: 'Erro', description: 'Serviços indisponíveis.', variant: 'destructive' });
            return;
        }
    
        const toastId = toast({ title: 'Excluindo documento...', description: 'Aguarde...' });
    
        try {
            const docRef = doc(firestore, 'fiscalDocuments', document.id);
            await deleteDoc(docRef);
    
            const fileRef = ref(storage, document.fileUrl);
            await deleteObject(fileRef);
    
            logActivity(firestore, user, `excluiu o documento fiscal ${document.documentType} (${document.competencia}) de ${document.companyName}.`);
            toast({ id: toastId, title: 'Sucesso!', description: 'Documento fiscal excluído.' });
            onDelete();
        } catch (error: any) {
            // Se a exclusão do documento do Firestore funcionou, mas a do Storage falhou
            // com 'object-not-found', consideramos um sucesso.
            if (error.code === 'storage/object-not-found') {
                console.warn(`File not found in Storage, but this is acceptable: ${document.fileUrl}`);
                 logActivity(firestore, user, `excluiu o documento fiscal ${document.documentType} (${document.competencia}) de ${document.companyName}.`);
                toast({ id: toastId, title: 'Sucesso!', description: 'Registro do documento excluído (arquivo não encontrado no armazenamento).' });
                onDelete();
            } else {
                console.error("Error deleting fiscal document:", error);
                toast({ id: toastId, title: 'Erro!', description: 'Não foi possível excluir o documento. Verifique as permissões e tente novamente.', variant: 'destructive' });
            }
        }
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Documento Fiscal</DialogTitle>
          <DialogDescription>
            {document.documentType} - {document.companyName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="pt-4">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Empresa</span>
                    <span className="font-medium">{document.companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">CNPJ</span>
                    <span className="font-medium">{document.companyCnpj}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Competência</span>
                    <span className="font-medium">{document.competencia}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={getStatusVariant(document.status)}>{document.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Data do Upload</span>
                    <span className="font-medium">{new Date(document.uploadedAt).toLocaleString('pt-BR')}</span>
                </div>
            </div>
          </TabsContent>
          <TabsContent value="notes" className="pt-4">
              <NotesTab document={document} />
          </TabsContent>
        </Tabs>
        
        <DialogFooter className='sm:justify-between pt-4 border-t'>
            <div className="flex gap-2">
                <Button asChild variant="outline">
                    <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Arquivo
                    </a>
                </Button>
                {profile?.permissions.fiscal.delete && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o documento e seu arquivo associado.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sim, Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
