'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, FileText, Calendar as CalendarIcon, FilterX } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collectionGroup, query, getDocs, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Module = 'Empresa' | 'Processo' | 'Obrigação' | 'Fiscal' | 'Sócio';
const modules: Module[] = ['Empresa', 'Processo', 'Obrigação', 'Fiscal', 'Sócio'];

interface UnifiedDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
  module: Module;
  relatedTo: string; // e.g., Company Name, Process Type
  fileType: string;
  competencia?: string; // MM/YYYY
}

export function DocumentsClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('Todos');
  const [fileTypeFilter, setFileTypeFilter] = useState('Todos');
  const [competenceFilter, setCompetenceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  
  const [allDocuments, setAllDocuments] = useState<UnifiedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile } = useUser();

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'xml': return 'XML';
      case 'doc':
      case 'docx': return 'Word';
      case 'xls':
      case 'xlsx': return 'Excel';
      case 'pfx': return 'Certificado';
      default: return extension?.toUpperCase() || 'Outro';
    }
  };

  useEffect(() => {
    const fetchAllDocuments = async () => {
      if (!firestore || !profile) return;
      setIsLoading(true);

      const collectedDocs: UnifiedDocument[] = [];
      const userPermissions = profile.permissions;
      let hasErrors = false;

      try {
        const queries = [];
        if (userPermissions.empresas?.read) {
          queries.push({ q: query(collectionGroup(firestore, 'documents')), module: 'Empresa' as Module, nameField: 'fileName', dateField: 'uploadDate', relatedToField: 'companyName' });
        }
        if (userPermissions.processos?.read) {
          queries.push({ q: query(collectionGroup(firestore, 'attachments')), module: 'Processo' as Module, nameField: 'name', dateField: 'uploadedAt', relatedToField: 'processId' });
        }
        if (userPermissions.fiscal?.read) {
           queries.push({ q: query(collectionGroup(firestore, 'fiscalDocuments')), module: 'Fiscal' as Module, nameField: 'documentType', dateField: 'uploadedAt', relatedToField: 'companyName', competenceField: 'competencia' });
        }

        const promises = queries.map(q => getDocs(q.q));
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const snapshot = result.value;
            const { module, nameField, dateField, relatedToField, competenceField } = queries[index];

            snapshot.forEach(doc => {
              const data = doc.data();
              const pathSegments = doc.ref.path.split('/');
              let currentModule: Module = module;

              if (module === 'Processo') {
                  if (pathSegments.includes('taxObligations')) {
                    if (!userPermissions.obrigacoes?.read) return;
                    currentModule = 'Obrigação';
                  } else if (pathSegments.includes('corporateProcesses')) {
                     if (!userPermissions.processos?.read) return;
                     currentModule = 'Processo';
                  } else {
                     return;
                  }
              }

              if (nameField === 'fileName' && data.fileName === 'certificate.pfx') {
                currentModule = 'Empresa';
              }
              
              let name = data[nameField] || data.name || 'Nome Desconhecido';
              if(module === 'Fiscal') name = `${data.documentType} - ${data.competencia}`;

              const uploadedAt = data[dateField] ? (data[dateField] instanceof Timestamp ? data[dateField].toDate() : new Date(data[dateField])) : new Date();

              let relatedTo = data[relatedToField] || 'N/A';
              if(module === 'Processo' && currentModule === 'Processo') relatedTo = `Processo para ${data.companyName}`;
              if(currentModule === 'Obrigação') relatedTo = `Obrigação para ${data.companyName}`;

              collectedDocs.push({
                  id: doc.id,
                  name: name,
                  url: data.fileUrl || data.url,
                  uploadedAt: uploadedAt,
                  uploadedBy: data.responsibleUserName || data.uploadedBy || 'Sistema',
                  module: currentModule,
                  relatedTo: relatedTo,
                  fileType: getFileType(name),
                  competencia: competenceField && data[competenceField] ? data[competenceField] : undefined,
              });
            });
          } else {
            console.error(`Error fetching documents for module ${queries[index].module}:`, result.reason);
            hasErrors = true;
          }
        });

        // Adiciona e-CPFs da coleção de sócios se tiver permissão
        if (userPermissions.societario?.read) {
          try {
            const partnersSnap = await getDocs(query(collectionGroup(firestore, 'partners')));
            partnersSnap.forEach(doc => {
                const data = doc.data();
                if (data.ecpfUrl) {
                    const alreadyExists = collectedDocs.some(d => d.url === data.ecpfUrl);
                    if (!alreadyExists) {
                        collectedDocs.push({
                            id: doc.id + '_ecpf',
                            name: `e-CPF de ${data.name}.pfx`,
                            url: data.ecpfUrl,
                            uploadedAt: new Date(), 
                            uploadedBy: 'Sistema',
                            module: 'Sócio',
                            relatedTo: data.name,
                            fileType: 'Certificado',
                            competencia: data.ecpfValidity ? format(new Date(data.ecpfValidity + 'T00:00:00'), 'MM/yyyy') : undefined,
                        });
                    }
                }
            });
          } catch (error) {
            console.error("Error fetching partner documents:", error);
            hasErrors = true;
          }
        }

        collectedDocs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
        setAllDocuments(collectedDocs);

        if (hasErrors) {
          toast({ title: "Atenção", description: "Não foi possível carregar os arquivos de todos os módulos. Alguns documentos podem não estar listados.", variant: "default" });
        }

      } catch (error) {
        console.error("An unexpected error occurred:", error);
        toast({ title: "Erro Inesperado", description: "Ocorreu um erro inesperado ao processar sua solicitação.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDocuments();
  }, [firestore, toast, profile]);

  const fileTypes = useMemo(() => {
    if (!allDocuments) return [];
    const types = new Set(allDocuments.map(doc => doc.fileType));
    return ['Todos', ...Array.from(types)];
  }, [allDocuments]);
  

  const filteredDocuments = useMemo(() => {
    if (!allDocuments) return [];
    return allDocuments.filter(doc => {
        const searchMatch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            doc.relatedTo.toLowerCase().includes(searchTerm.toLowerCase());
        
        const moduleMatch = moduleFilter === 'Todos' || doc.module === moduleFilter;
        const fileTypeMatch = fileTypeFilter === 'Todos' || doc.fileType === fileTypeFilter;
        const competenceMatch = !competenceFilter || (doc.competencia && doc.competencia.includes(competenceFilter));
        const dateMatch = !dateFilter || format(doc.uploadedAt, 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
        
        return searchMatch && moduleMatch && fileTypeMatch && competenceMatch && dateMatch;
    });
  }, [allDocuments, searchTerm, moduleFilter, fileTypeFilter, competenceFilter, dateFilter]);

  const formatDate = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setModuleFilter('Todos');
    setFileTypeFilter('Todos');
    setCompetenceFilter('');
    setDateFilter(undefined);
  }
  
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
        <div className="flex flex-col gap-4 mb-4">
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Buscar por nome do arquivo, empresa, sócio relacionado..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Módulo" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Todos os Módulos</SelectItem>
                        {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Tipo" /></SelectTrigger>
                    <SelectContent>
                        {fileTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input
                    placeholder="Competência (MM/AAAA)"
                    className="w-full md:w-[200px]"
                    value={competenceFilter}
                    onChange={(e) => setCompetenceFilter(e.target.value)}
                    maxLength={7}
                />
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={'outline'} className={cn('w-full md:w-auto justify-start text-left font-normal', !dateFilter && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(dateFilter, 'PPP', { locale: ptBR }) : <span>Filtrar por Data</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus /></PopoverContent>
                </Popover>
                <Button variant="ghost" onClick={clearFilters} className="w-full md:w-auto">
                    <FilterX className="mr-2 h-4 w-4" /> Limpar Filtros
                </Button>
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
                    Nenhum documento encontrado com os filtros aplicados.
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
