'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { Loader2, Trash2, UploadCloud, Download, MessageSquare, Phone, Mail, RefreshCw } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { CertificateUploadDialog } from './certificate-upload-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyDocumentsTab } from './company-documents-tab';
import { logActivity } from '@/lib/activity-log';
import type { SintegraResult } from '@/lib/sintegra/types';

interface RawPartnerFromApi {
  nome_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
  cnpj_cpf_do_socio?: string;
  percentual_capital_social?: number;
}

interface NormalizedPartner {
    name: string;
    qualification: string;
    entryDate: string;
    cpfCnpj: string;
    sharePercent: number | null;
}

export interface Company {
    id: string;
    name: string;
    fantasyName?: string;
    cnpj: string;
    status: string;
    taxRegime: string;
    startDate: string;
    cnae?: string;
    address?: string;
    phone?: string;
    email?: string | null;
    capital?: number;
    legalNature?: string;
    porte?: string;
    qsa?: RawPartnerFromApi[];
    certificateA1Validity?: string;
    certificateA1Url?: string;
    internalEmail?: string;
    internalPhone?: string;
    whatsappGroup?: string;
    sintegra?: SintegraResult;
}

interface CompanyDetailsDialogProps {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyUpdated: () => void;
  onCompanyDeleted: () => void;
}

const formSchema = z.object({
  taxRegime: z.string(),
  internalEmail: z.string().email({ message: "Formato de e-mail inválido." }).optional().or(z.literal('')),
  internalPhone: z.string().optional(),
  whatsappGroup: z.string().optional(),
});

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    if (!status) return 'secondary';
    switch(status.toLowerCase()) {
        case 'ativa': return 'default';
        case 'inapta': return 'destructive';
        case 'baixada': return 'outline';
        default: return 'secondary';
    }
}

const normalizeQsaData = (qsa: RawPartnerFromApi[] | undefined): NormalizedPartner[] => {
    if (!qsa) {
        return [];
    }

    return qsa.map(socio => {
        let entryDateFormatted = 'N/A';
        if (socio.data_entrada_sociedade) {
            try {
                const [year, month, day] = socio.data_entrada_sociedade.split('-');
                entryDateFormatted = `${day}/${month}/${year}`;
            } catch (e) {}
        }

        return {
            name: socio.nome_socio || '',
            qualification: socio.qualificacao_socio || '',
            entryDate: entryDateFormatted,
            cpfCnpj: socio.cnpj_cpf_do_socio || '',
            sharePercent: socio.percentual_capital_social ?? null,
        };
    });
};


export function CompanyDetailsDialog({ company, open, onOpenChange, onCompanyUpdated, onCompanyDeleted }: CompanyDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCertUploadOpen, setIsCertUploadOpen] = useState(false);
  const firestore = useFirestore();
  const { user, profile } = useUser();
  const { toast } = useToast();

  const certificateRef = useMemoFirebase(() => 
    firestore ? doc(firestore, `companies/${company.id}/certificates/A1`) : null,
    [firestore, company.id]
  );
  const { data: certificateData } = useDoc(certificateRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taxRegime: company.taxRegime,
      internalEmail: company.internalEmail || '',
      internalPhone: company.internalPhone || '',
      whatsappGroup: company.whatsappGroup || '',
    },
  });
  
  useEffect(() => {
    form.reset({
      taxRegime: company.taxRegime,
      internalEmail: company.internalEmail || '',
      internalPhone: company.internalPhone || '',
      whatsappGroup: company.whatsappGroup || '',
    })
  }, [company, form]);

  const normalizedQsa = normalizeQsaData(company.qsa);

  const handleDelete = () => {
    if (!firestore || !user) {
      toast({ title: "Erro", description: "O serviço de banco de dados não está disponível.", variant: "destructive"});
      return;
    }

    const companyRef = doc(firestore, 'companies', company.id);
    deleteDocumentNonBlocking(companyRef);
    
    logActivity(firestore, user, `excluiu a empresa ${company.name}.`);

    toast({
      title: "Empresa Excluída",
      description: `${company.name} foi removida do sistema.`
    });
    
    onCompanyDeleted();
    onOpenChange(false);
  };
  
  const handleCertificateUpdated = () => {
    onCompanyUpdated();
  }
  
  const handleSync = async () => {
    if (!firestore || !user) return;
    setIsSyncing(true);
    const toastId = toast({ title: "Sincronizando dados...", description: `Buscando informações atualizadas para ${company.name}.`});

    try {
        const numericCnpj = company.cnpj.replace(/[^\d]/g, '');
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numericCnpj}`);
        if (!response.ok) {
            throw new Error('Não foi possível consultar os dados na API da Receita Federal.');
        }

        const data = await response.json();
        
        let newTaxRegime = "Lucro Presumido / Real";
        if (data.opcao_pelo_simples || data.simples_nacional) {
            newTaxRegime = "Simples Nacional";
        }

        const updates: Partial<Company> = {
            name: data.razao_social,
            status: data.descricao_situacao_cadastral,
            taxRegime: newTaxRegime,
            address: `${data.logradouro || ''}, ${data.numero || ''}, ${data.complemento || ''} - ${data.bairro || ''}, ${data.municipio || ''} - ${data.uf || ''}, ${data.cep || ''}`.replace(/ ,/g, '').replace(/,  -/g,', '),
        };

        const companyRef = doc(firestore, 'companies', company.id);
        setDocumentNonBlocking(companyRef, updates, { merge: true });

        if (company.taxRegime === 'Simples Nacional' && newTaxRegime !== 'Simples Nacional') {
             toast({
                id: toastId,
                title: "🚨 Alerta de Desenquadramento!",
                description: `A empresa ${company.name} não é mais optante pelo Simples Nacional. O regime foi atualizado.`,
                variant: 'destructive',
                duration: 10000,
            });
             logActivity(firestore, user, `detectou o desenquadramento do Simples Nacional para ${company.name}.`);
        } else {
            toast({
                id: toastId,
                title: "Sincronização Concluída!",
                description: "Os dados da empresa foram atualizados com sucesso.",
            });
            logActivity(firestore, user, `sincronizou os dados da empresa ${company.name} com a Receita Federal.`);
        }

        onCompanyUpdated();

    } catch (error: any) {
        console.error(error);
        toast({
            id: toastId,
            title: "Erro na Sincronização",
            description: error.message || 'Ocorreu um erro inesperado.',
            variant: "destructive",
        });
    } finally {
        setIsSyncing(false);
    }
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
     if (!firestore) {
      toast({
        title: 'Erro',
        description: 'O serviço de banco de dados não está disponível.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    try {
      const companyRef = doc(firestore, 'companies', company.id);
      
      const updatedCompanyData = {
        taxRegime: values.taxRegime,
        internalEmail: values.internalEmail,
        internalPhone: values.internalPhone,
        whatsappGroup: values.whatsappGroup,
      };

      setDocumentNonBlocking(companyRef, updatedCompanyData, { merge: true });

      toast({
        title: 'Empresa Atualizada!',
        description: `Os dados de ${company.name} foram salvos.`,
      });

      onCompanyUpdated();
    } catch (error: any) {
       console.error(error);
      toast({
        title: 'Erro ao atualizar empresa',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const displayValidity = certificateData?.validity || company.certificateA1Validity;
  const displayUrl = certificateData?.url || company.certificateA1Url;


  return (
    <>
    <CertificateUploadDialog
      company={company}
      open={isCertUploadOpen}
      onOpenChange={setIsCertUploadOpen}
      onCertificateUpdated={handleCertificateUpdated}
    />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className='font-headline text-2xl'>{company.name}</DialogTitle>
                <DialogDescription>{company.fantasyName || 'Sem nome fantasia'}</DialogDescription>
              </div>
              <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
            </div>
          </DialogHeader>
          
           <Tabs defaultValue="details" className="w-full flex-grow overflow-hidden flex flex-col" id="company-details-tabs">
              <div className='px-6 border-b'>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Detalhes da Empresa</TabsTrigger>
                    <TabsTrigger value="documents" id="company-details-documents-tab-trigger">Documentos</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-grow overflow-y-auto px-6">
                <TabsContent value="details" className="py-4 space-y-6">
                    <Form {...form}>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                            <Label className='text-muted-foreground'>CNPJ</Label>
                            <p className="font-medium">{company.cnpj}</p>
                        </div>
                        <div>
                            <Label className='text-muted-foreground'>Data de Abertura</Label>
                            <p className="font-medium">{company.startDate}</p>
                        </div>
                        <FormField
                            control={form.control}
                            name="taxRegime"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Regime Tributário</FormLabel>
                                <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                    disabled={!profile?.permissions.empresas.update || company.taxRegime === 'Simples Nacional'}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o regime" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Simples Nacional" disabled>Simples Nacional</SelectItem>
                                    <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                                    <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                                    <SelectItem value="Lucro Presumido / Real">Lucro Presumido / Real</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <div>
                            <Label className='text-muted-foreground'>Porte</Label>
                            <p className="font-medium">{company.porte || 'Não informado'}</p>
                        </div>
                        <div>
                            <Label className='text-muted-foreground'>Natureza Jurídica</Label>
                            <p className="font-medium">{company.legalNature || 'Não informado'}</p>
                        </div>
                        <div>
                            <Label className='text-muted-foreground'>Capital Social</Label>
                            <p className="font-medium">{company.capital?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Não informado'}</p>
                        </div>
                        <div className='col-span-2'>
                            <Label className='text-muted-foreground'>Atividade Principal (CNAE)</Label>
                            <p className="font-medium">{company.cnae || 'Não informado'}</p>
                        </div>
                      </div>
                      
                      <Separator/>
                      
                       <div id="company-details-internal-contact">
                        <h3 className="font-semibold font-headline mb-4">Contato Interno</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <FormField
                              control={form.control}
                              name="internalEmail"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel className='flex items-center gap-2 text-muted-foreground'><Mail className="h-4 w-4"/> E-mail Interno</FormLabel>
                                  <FormControl>
                                      <Input placeholder="email@contato.com" {...field} disabled={!profile?.permissions.empresas.update}/>
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="internalPhone"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel className='flex items-center gap-2 text-muted-foreground'><Phone className="h-4 w-4"/> Contato (Telefone)</FormLabel>
                                  <FormControl>
                                      <Input placeholder="(00) 00000-0000" {...field} disabled={!profile?.permissions.empresas.update}/>
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                           <FormField
                              control={form.control}
                              name="whatsappGroup"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel className='flex items-center gap-2 text-muted-foreground'><MessageSquare className="h-4 w-4"/> Grupo de WhatsApp</FormLabel>
                                  <FormControl>
                                      <Input placeholder="Link ou nome do grupo" {...field} disabled={!profile?.permissions.empresas.update}/>
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />
                        </div>
                      </div>

                    </Form>

                    <Separator/>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className='space-y-2'>
                          <h3 className="font-semibold font-headline">Endereço Cadastrado</h3>
                          <p className="text-sm text-muted-foreground">{company.address || 'Não informado'}</p>
                      </div>
                      <div className='space-y-2'>
                          <h3 className="font-semibold font-headline">Contato Cadastrado</h3>
                          <p className="text-sm text-muted-foreground">
                          Telefone: {company.phone || 'Não informado'} <br/>
                          Email: {company.email || 'Não informado'}
                          </p>
                      </div>
                    </div>
                    
                    <Separator />

                    <div id="company-details-certificate">
                        <h3 className="font-semibold font-headline mb-2">Certificado Digital A1</h3>
                        <div className="flex items-center justify-between rounded-lg border p-4 gap-4">
                            <div className="space-y-1">
                                <Label>Data de Vencimento</Label>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {displayValidity ? new Date(displayValidity + 'T00:00:00-03:00').toLocaleDateString('pt-BR') : 'Não informado'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {displayUrl && (
                                  <Button variant="outline" size="sm" asChild>
                                      <a href={displayUrl} download={`${company.name}_${company.cnpj}.pfx`} target="_blank" rel="noopener noreferrer">
                                          <Download className="mr-2 h-4 w-4" />
                                          Baixar
                                      </a>
                                  </Button>
                              )}
                              <Button type="button" size="sm" onClick={() => setIsCertUploadOpen(true)}>
                                  <UploadCloud className="mr-2 h-4 w-4" />
                                  Adicionar/Atualizar
                              </Button>
                            </div>
                        </div>
                    </div>
                
                    <div id="company-details-qsa">
                      <h3 className='font-semibold font-headline mb-2'>Quadro de Sócios e Administradores (QSA)</h3>
                      <div className="border rounded-md">
                          <Table>
                          <TableHeader>
                              <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Qualificação</TableHead>
                              <TableHead>Data de Entrada</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {normalizedQsa.length > 0 ? (
                              normalizedQsa.map((socio, index) => (
                                  <TableRow key={index}>
                                  <TableCell className="font-medium">{socio.name}</TableCell>
                                  <TableCell>{socio.qualification}</TableCell>
                                  <TableCell>{socio.entryDate}</TableCell>
                                  </TableRow>
                              ))
                              ) : (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                  Nenhum sócio ou administrador encontrado.
                                  </TableCell>
                              </TableRow>
                              )}
                          </TableBody>
                          </Table>
                      </div>
                    </div>

                    <Separator />

                     <div id="company-details-sintegra">
                        <h3 className="font-semibold font-headline mb-2">Informações Sintegra</h3>
                        {company.sintegra && company.sintegra.status === 'DONE' && company.sintegra.data ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div><Label className='text-muted-foreground'>Inscrição Estadual (IE)</Label><p className="font-medium">{company.sintegra.data.ie || 'N/A'}</p></div>
                                <div><Label className='text-muted-foreground'>Situação Cadastral</Label><p className="font-medium">{company.sintegra.data.situacaoCadastral || 'N/A'}</p></div>
                                <div><Label className='text-muted-foreground'>Data da Situação</Label><p className="font-medium">{company.sintegra.data.dataSituacaoCadastral || 'N/A'}</p></div>
                                <div className='col-span-1'><Label className='text-muted-foreground'>Ocorrência Fiscal</Label><p className="font-medium">{company.sintegra.data.ocorrenciaFiscal || 'N/A'}</p></div>
                                <div className='col-span-1'><Label className='text-muted-foreground'>Regime Apuração</Label><p className="font-medium">{company.sintegra.data.regimeApuracao || 'N/A'}</p></div>
                                <div><Label className='text-muted-foreground'>Posto Fiscal</Label><p className="font-medium">{company.sintegra.data.postoFiscal || 'N/A'}</p></div>
                            </div>
                        ) : company.sintegra && company.sintegra.status === 'PENDING' ? (
                            <p className="text-sm text-muted-foreground">Consulta Sintegra em andamento...</p>
                        ) : company.sintegra && (company.sintegra.status === 'ERROR' || company.sintegra.status === 'TIMEOUT') ? (
                             <p className="text-sm text-destructive">Falha na consulta do Sintegra: {company.sintegra.error}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma informação do Sintegra encontrada. Realize a consulta no módulo de Empresas.</p>
                        )}
                    </div>

                </TabsContent>
                <TabsContent value="documents">
                    <CompanyDocumentsTab company={company} />
                </TabsContent>
              </div>
            </Tabs>

          <DialogFooter className="p-6 pt-4 flex-row justify-between w-full border-t">
            <div className='flex gap-2 items-center'>
              {profile?.permissions.empresas.delete ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" id="company-details-delete-button">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Empresa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá excluir permanentemente a empresa <strong>{company.name}</strong> e todos os seus dados associados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Sim, excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : <div></div>}
              {profile?.permissions.empresas.update && (
                 <Button variant="outline" onClick={handleSync} disabled={isSyncing} id="company-details-sync-button">
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Sincronizar com Receita
                </Button>
              )}
            </div>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Fechar</Button>
                </DialogClose>
                {profile?.permissions.empresas.update && (
                  <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isLoading} id="company-details-save-button">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                )}
              </div>
          </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
