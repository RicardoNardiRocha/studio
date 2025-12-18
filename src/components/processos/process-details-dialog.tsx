
'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, CalendarIcon, Upload, Download, FileText } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection, addDoc, deleteDoc, updateDoc, writeBatch, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CorporateProcess, ProcessStatus, ProcessPriority } from './corporate-processes-client';
import { logActivity } from '@/lib/activity-log';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

interface ProcessDetailsDialogProps {
  process: CorporateProcess;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessUpdated: () => void;
  onProcessDeleted: () => void;
}

const processTypes = ['Abertura', 'Alteração', 'Baixa', 'Certidão', 'Parcelamento', 'Outro'];
const processStatuses: ProcessStatus[] = ['Aguardando Documentação', 'Em Análise', 'Em Preenchimento', 'Protocolado', 'Em Andamento Externo', 'Aguardando Cliente', 'Aguardando Órgão', 'Em Exigência', 'Concluído', 'Cancelado'];
const processPriorities: ProcessPriority[] = ['Baixa', 'Média', 'Alta'];


const formSchema = z.object({
  processType: z.string({ required_error: 'O tipo do processo é obrigatório.' }),
  status: z.enum(processStatuses),
  priority: z.enum(processPriorities),
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  protocolDate: z.date().nullable().optional(),
  notes: z.string().optional(),
});


const toDate = (date: any): Date | undefined => {
    if (!date) return undefined;
    if (date instanceof Date) return date;
    if (date.seconds) return new Date(date.seconds * 1000);
    if (typeof date === 'string') return parseISO(date);
    return undefined;
}

const getStatusBadgeVariant = (status: ProcessStatus): 'success' | 'info' | 'cyan' | 'warning' | 'destructive' | 'outline' | 'secondary' => {
  switch (status) {
    case 'Concluído':
      return 'success';
    case 'Em Análise':
    case 'Protocolado':
      return 'info';
    case 'Em Preenchimento':
    case 'Em Andamento Externo':
      return 'cyan';
    case 'Aguardando Documentação':
    case 'Aguardando Cliente':
    case 'Aguardando Órgão':
      return 'warning';
    case 'Em Exigência':
        return 'destructive';
    case 'Cancelado':
      return 'outline';
    default:
      return 'secondary';
  }
};


export function ProcessDetailsDialog({
  process, open, onOpenChange, onProcessUpdated, onProcessDeleted
}: ProcessDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const firestore = useFirestore();
  const storage = getStorage();
  const { toast } = useToast();
  const { user, profile } = useUser();

  const attachmentsQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, `companies/${process.companyId}/corporateProcesses/${process.id}/attachments`), orderBy('uploadedAt', 'desc')), [firestore, process.id, process.companyId]);
  const { data: attachments, isLoading: isLoadingAttachments } = useCollection(attachmentsQuery);

  const historyQuery = useMemoFirebase(() => !firestore ? null : query(collection(firestore, `companies/${process.companyId}/corporateProcesses/${process.id}/history`), orderBy('timestamp', 'desc')), [firestore, process.id, process.companyId]);
  const { data: history, isLoading: isLoadingHistory } = useCollection(historyQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      processType: process.processType,
      status: process.status,
      priority: process.priority,
      startDate: toDate(process.startDate),
      protocolDate: toDate(process.protocolDate),
      notes: process.notes,
    },
  });

  const handleDelete = () => {
    if (!firestore || !user) {
      toast({ title: 'Erro', description: 'O serviço de banco de dados não está disponível.', variant: 'destructive' });
      return;
    }
    const processRef = doc(firestore, 'companies', process.companyId, 'corporateProcesses', process.id);
    deleteDocumentNonBlocking(processRef);
    logActivity(firestore, user, `excluiu o processo de ${process.processType} de ${process.companyName}.`);
    toast({
      title: 'Processo Excluído',
      description: `O processo de ${process.processType} para ${process.companyName} foi removido.`,
    });
    onProcessDeleted();
    onOpenChange(false);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore) return;

    setIsUploading(true);
    try {
        const filePath = `processes/${process.id}/${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        const batch = writeBatch(firestore);
        
        const attachmentRef = doc(collection(firestore, `companies/${process.companyId}/corporateProcesses/${process.id}/attachments`));
        batch.set(attachmentRef, {
            id: attachmentRef.id,
            name: file.name,
            url: fileUrl,
            uploadedAt: serverTimestamp(),
            uploadedBy: user.displayName,
        });

        const historyRef = doc(collection(firestore, `companies/${process.companyId}/corporateProcesses/${process.id}/history`));
        batch.set(historyRef, {
            id: historyRef.id,
            timestamp: serverTimestamp(),
            userId: user.uid,
            userName: user.displayName,
            action: `Anexou o documento: ${file.name}`
        });

        await batch.commit();
        toast({ title: "Anexo enviado com sucesso!" });

    } catch (error) {
        toast({ title: "Erro ao enviar anexo.", variant: 'destructive' });
    } finally {
        setIsUploading(false);
    }
  }
  
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, `companies/${process.companyId}/corporateProcesses/${process.id}/attachments`, attachmentId));
        toast({ title: "Anexo excluído."});
    } catch (error) {
        toast({ title: "Erro ao excluir anexo.", variant: "destructive"});
    }
  }


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!firestore || !user) {
      toast({ title: 'Erro', description: 'Serviço de banco de dados ou autenticação não disponível.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    try {
      const batch = writeBatch(firestore);
      const processRef = doc(firestore, 'companies', process.companyId, 'corporateProcesses', process.id);
      
      const updatedData = {
        processType: values.processType,
        status: values.status,
        priority: values.priority,
        startDate: values.startDate,
        protocolDate: values.protocolDate,
        notes: values.notes || '', // Garantir que notes não seja undefined
      };

      batch.update(processRef, updatedData);

      const oldStatus = process.status;
      if(oldStatus !== values.status) {
         const historyRef = doc(collection(firestore, `companies/${process.companyId}/corporateProcesses/${process.id}/history`));
         batch.set(historyRef, {
            id: historyRef.id,
            timestamp: serverTimestamp(),
            userId: user.uid,
            userName: user.displayName,
            action: `Alterou o status de "${oldStatus}" para "${values.status}"`
        });
      }


      await batch.commit();
      logActivity(firestore, user, `atualizou o processo de ${values.processType} de ${process.companyName} para o status ${values.status}.`);

      toast({
        title: 'Processo Atualizado!',
        description: `Os dados do processo foram salvos.`,
      });
      onProcessUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erro ao atualizar processo',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = profile?.permissions.processos.update;
  const canDelete = profile?.permissions.processos.delete;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhes do Processo</DialogTitle>
          <DialogDescription>
            Visualize e edite as informações do processo para <span className='font-bold'>{process.companyName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="details" className="flex-grow overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="attachments">Anexos</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <div className="flex-grow overflow-y-auto">
                <TabsContent value="details">
                     <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
                        <div className='grid grid-cols-2 gap-4'>
                         <FormField control={form.control} name="processType" render={({ field }) => (<FormItem><FormLabel>Tipo de Processo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={true}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent>{processTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                         <FormField 
                            control={form.control} 
                            name="status" 
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canEdit}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue asChild>
                                             <Badge variant={getStatusBadgeVariant(field.value)} className="font-medium">{field.value}</Badge>
                                        </SelectValue>
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {processStatuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                             <Badge variant={getStatusBadgeVariant(status)} className="border-none shadow-none font-medium">{status}</Badge>
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <FormField control={form.control} name="priority" render={({ field }) => (<FormItem><FormLabel>Prioridade</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canEdit}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{processPriorities.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data de Início</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')} disabled={true}>{field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="protocolDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Data do Protocolo (Opcional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')} disabled={!canEdit}>{field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Nenhuma</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notas Internas</FormLabel><FormControl><Textarea placeholder="Adicione notas sobre o processo..." {...field} disabled={!canEdit}/></FormControl><FormMessage /></FormItem>)}/>
                      </form>
                    </Form>
                </TabsContent>
                
                <TabsContent value="attachments" className="p-4 space-y-4">
                     {canEdit && (
                        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                            Adicionar Anexo
                        </Button>
                     )}
                    <Input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    
                    <ul className="space-y-2">
                        {isLoadingAttachments && <Skeleton className="h-10 w-full" />}
                        {attachments?.map(att => (
                            <li key={att.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground"/>
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">{att.name}</a>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button variant="ghost" size="icon" asChild><a href={att.url} download={att.name}><Download className="h-4 w-4"/></a></Button>
                                     {canDelete && <Button variant="ghost" size="icon" onClick={() => handleDeleteAttachment(att.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                                </div>
                            </li>
                        ))}
                         {!isLoadingAttachments && attachments?.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum anexo encontrado.</p>
                        )}
                    </ul>
                </TabsContent>
                
                <TabsContent value="history" className="p-4">
                     <ul className="space-y-4">
                        {isLoadingHistory && Array.from({length:3}).map((_, i) => <li key={i}><Skeleton className="h-12 w-full"/></li>)}
                        {history?.map(entry => (
                             <li key={entry.id} className="flex items-start gap-3">
                                <div className="flex-shrink-0"><Badge variant="secondary">{format(toDate(entry.timestamp)!, 'dd/MM HH:mm')}</Badge></div>
                                <div>
                                    <p className="text-sm">{entry.action}</p>
                                    <p className="text-xs text-muted-foreground">por {entry.userName}</p>
                                </div>
                            </li>
                        ))}
                         {!isLoadingHistory && history?.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum histórico encontrado.</p>
                        )}
                    </ul>
                </TabsContent>
            </div>
        </Tabs>
        <DialogFooter className="pt-4 flex-row justify-between w-full border-t">
          {canDelete ? (
            <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Excluir</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isso irá excluir permanentemente o processo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Sim, excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          ) : <div></div>}
          <div className="flex gap-2"><DialogClose asChild><Button type="button" variant="ghost">Fechar</Button></DialogClose>
          {canEdit && <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
