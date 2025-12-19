
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, ShieldCheck, ShieldX, ShieldQuestion, RefreshCw, Loader2, AlertTriangle, X } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { AddPartnerDialog } from '@/components/societario/add-partner-dialog';
import { PartnerDetailsDialog } from '@/components/societario/partner-details-dialog';
import type { Partner } from '@/components/societario/partner-details-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { differenceInDays, isValid, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type EcpfStatusFilter = 'Todos' | 'Sim' | 'Não';
const ecpfStatusOptions: EcpfStatusFilter[] = ['Todos', 'Sim', 'Não'];

type ValidityStatus = 'Válido' | 'Vencendo' | 'Vencido' | 'Não informado';
const validityStatusOptions: Array<'Todos' | ValidityStatus> = ['Todos', 'Válido', 'Vencendo', 'Vencido', 'Não informado'];

const cpfMask = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g,'')
    value = value.replace(/(\d{3})(\d)/,"$1.$2")
    value = value.replace(/(\d{3})(\d)/,"$1.$2")
    value = value.replace(/(\d{3})(\d{1,2})$/,"$1-$2")
    return value.slice(0, 14)
}

const getCertificateStatusInfo = (validity?: string): { text: string; status: ValidityStatus; variant: 'default' | 'destructive' | 'secondary' | 'warning'; daysLeft?: number, Icon: React.ElementType, dateText: string } => {
  if (!validity) {
    return { text: 'Não informado', status: 'Não informado', variant: 'secondary', Icon: ShieldQuestion, dateText: 'N/A' };
  }
  try {
    const [year, month, day] = validity.split('-').map(Number);
    const validityDate = startOfDay(new Date(year, month - 1, day));
     if (!isValid(validityDate)) {
        return { text: 'Data inválida', status: 'Não informado', variant: 'secondary', Icon: ShieldQuestion, dateText: 'Inválida' };
    }

    const today = startOfDay(new Date());
    const daysLeft = differenceInDays(validityDate, today);
    const dateText = validityDate.toLocaleDateString('pt-BR');

    if (daysLeft < 0) {
      return { text: 'Vencido', status: 'Vencido', variant: 'destructive', daysLeft, Icon: ShieldX, dateText };
    }
    if (daysLeft <= 60) {
      return { text: `Vence em ${daysLeft}d`, status: 'Vencendo', variant: 'warning', daysLeft, Icon: ShieldCheck, dateText };
    }
    return { text: 'Válido', status: 'Válido', variant: 'default', daysLeft, Icon: ShieldCheck, dateText };
  } catch (e) {
    return { text: 'Data inválida', status: 'Não informado', variant: 'secondary', Icon: ShieldQuestion, dateText: 'Inválida' };
  }
};


export default function SocietarioPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ecpfFilter, setEcpfFilter] = useState<EcpfStatusFilter>('Todos');
  const [validityFilter, setValidityFilter] = useState<'Todos' | ValidityStatus>('Todos');
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { profile } = useUser();
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  const firestore = useFirestore();

  const partnersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partners'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: partners, isLoading, forceRefetch } = useCollection<Partner>(partnersCollection);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const onlyNumbers = /^\d*$/.test(value.replace(/[.\-/]/g, ''));
    
    if (onlyNumbers) {
      setSearchTerm(cpfMask(value));
    } else {
      setSearchTerm(value);
    }
  };
  
  const expiringCertificates = useMemo(() => {
    if (!partners) return [];
    return partners.filter(p => {
      const statusInfo = getCertificateStatusInfo(p.ecpfValidity);
      return statusInfo.status === 'Vencido' || statusInfo.status === 'Vencendo';
    });
  }, [partners]);

  const filteredPartners = useMemo(() => {
    if (!partners) return [];

    const searchTermLower = searchTerm.toLowerCase();
    const hasLetters = /[a-zA-Z]/.test(searchTerm);
    const hasNumbers = /[0-9]/.test(searchTerm);
    
    return partners.filter(partner => {
      let searchMatch = false;

      // Logic based on search term content
      if (hasLetters && hasNumbers) { // Search only company names
        searchMatch = partner.associatedCompanies?.some(c => c.toLowerCase().includes(searchTermLower)) ?? false;
      } else if (hasLetters) { // Search partner name or company name
        const nameMatch = partner.name.toLowerCase().includes(searchTermLower);
        const companyMatch = partner.associatedCompanies?.some(c => c.toLowerCase().includes(searchTermLower)) ?? false;
        searchMatch = nameMatch || companyMatch;
      } else { // Search only CPF (hasNumbers is implied)
        const cleanSearchTerm = searchTerm.replace(/[^\d]/g, '');
        searchMatch = cleanSearchTerm ? partner.cpf.replace(/[^\d]/g, '').includes(cleanSearchTerm) : true; // show all if empty
      }
      
      const ecpfMatch = ecpfFilter === 'Todos' || (ecpfFilter === 'Sim' && partner.hasECPF) || (ecpfFilter === 'Não' && !partner.hasECPF);
      const validityMatch = validityFilter === 'Todos' || getCertificateStatusInfo(partner.ecpfValidity).status === validityFilter;

      return searchMatch && ecpfMatch && validityMatch;
    });
  }, [partners, searchTerm, ecpfFilter, validityFilter]);


  const handleSyncPartners = async () => {
    if (!firestore) {
      toast({ title: "Erro", description: "O serviço de banco de dados não está disponível.", variant: "destructive" });
      return;
    }
    setIsSyncing(true);
    toast({ title: "Iniciando sincronização...", description: "Buscando sócios das empresas cadastradas." });

    let partnersCreated = 0;
    let partnersUpdated = 0;

    try {
      const companiesQuery = query(collection(firestore, 'companies'));
      const companiesSnapshot = await getDocs(companiesQuery);

      for (const companyDoc of companiesSnapshot.docs) {
        const companyData = companyDoc.data();
        if (companyData.qsa && Array.isArray(companyData.qsa)) {
          for (const socio of companyData.qsa) {
            const socioCpfCnpjRaw = socio.cnpj_cpf_do_socio || '';
            const socioCpfCnpj = socioCpfCnpjRaw.replace(/[^\d]/g, '');
            const socioNome = socio.nome_socio;

            if (!socioCpfCnpj || !socioNome) continue;

            const partnerRef = doc(firestore, 'partners', socioCpfCnpj);
            const partnerSnap = await getDoc(partnerRef);

            if (partnerSnap.exists()) {
              const partnerData = partnerSnap.data();
              const associatedCompanies = partnerData.associatedCompanies || [];
              if (!associatedCompanies.includes(companyData.name)) {
                const updatedCompanies = [...associatedCompanies, companyData.name];
                await updateDoc(partnerRef, { associatedCompanies: updatedCompanies });
                partnersUpdated++;
              }
            } else {
              const newPartner = {
                id: socioCpfCnpj,
                name: socioNome,
                cpf: socioCpfCnpj.length === 11 ? `${socioCpfCnpj.slice(0,3)}.${socioCpfCnpj.slice(3,6)}.${socioCpfCnpj.slice(6,9)}-${socioCpfCnpj.slice(9)}` : socioCpfCnpj,
                qualification: socio.qualificacao_socio,
                hasECPF: false,
                ecpfValidity: '',
                govBrLogin: '',
                govBrPassword: '',
                associatedCompanies: [companyData.name],
                otherData: '',
              };
              await setDoc(partnerRef, newPartner);
              partnersCreated++;
            }
          }
        }
      }
      toast({
        title: "Sincronização Concluída!",
        description: `${partnersCreated} sócios criados, ${partnersUpdated} sócios atualizados.`
      });
      forceRefetch();

    } catch (error) {
      console.error("Erro ao sincronizar sócios: ", error);
      toast({ title: "Erro na sincronização", description: "Não foi possível completar a sincronização.", variant: "destructive"});
    } finally {
      setIsSyncing(false);
    }
  };


  const handleAction = () => {
    setIsDetailsDialogOpen(false);
    forceRefetch();
  };

  const handleOpenDetails = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDetailsDialogOpen(true);
  };
  

  return (
    <>
      {profile?.permissions.societario.create && (
        <AddPartnerDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onPartnerAdded={handleAction}
        />
      )}
      {selectedPartner && (
        <PartnerDetailsDialog
          key={selectedPartner.id}
          partner={selectedPartner}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onPartnerUpdated={handleAction}
          onPartnerDeleted={handleAction}
        />
      )}
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-6">
        <div className="mb-4">
        {!isAlertDismissed && expiringCertificates.length > 0 && (
            <Alert variant="destructive" className="relative">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: e-CPFs Vencendo!</AlertTitle>
            <AlertDescription>
                Você possui <strong>{expiringCertificates.length}</strong> certificados de sócios vencidos ou vencendo nos próximos 60 dias.
            </AlertDescription>
            <button
                onClick={() => setIsAlertDismissed(true)}
                className="absolute top-2 right-2 p-1 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            >
                <X className="h-4 w-4" />
            </button>
            </Alert>
        )}
        </div>
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline">
                Cadastro de Sócios e Administradores
              </CardTitle>
              <CardDescription>
                Gerencie os sócios e administradores de todas as empresas.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button variant="outline" onClick={handleSyncPartners} disabled={isSyncing}>
                  {isSyncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar Sócios via QSA
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Sócio
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, empresa ou CPF..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="w-full md:w-auto md:min-w-[180px]">
                <Select value={ecpfFilter} onValueChange={(value: EcpfStatusFilter) => setEcpfFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por E-CPF..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ecpfStatusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        E-CPF: {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="w-full md:w-auto md:min-w-[200px]">
                <Select value={validityFilter} onValueChange={(value: 'Todos' | ValidityStatus) => setValidityFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por validade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {validityStatusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Sócio</TableHead>                  <TableHead>CPF</TableHead>
                  <TableHead>E-CPF Ativo?</TableHead>
                  <TableHead>Validade do E-CPF</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPartners && filteredPartners.length > 0 ? (
                  filteredPartners.map((partner) => {
                    const certStatus = getCertificateStatusInfo(partner.ecpfValidity);
                    let rowVariant: 'destructive' | 'warning' | undefined = undefined;
                    if (certStatus.status === 'Vencido') {
                        rowVariant = 'destructive';
                    } else if (certStatus.status === 'Vencendo') {
                        rowVariant = 'warning';
                    }

                    return (
                      <TableRow key={partner.id} className={rowVariant === 'destructive' ? 'bg-destructive/10' : rowVariant === 'warning' ? 'bg-yellow-500/10' : ''}>
                        <TableCell className="font-medium">
                          <div className="text-xs text-muted-foreground">
                            {partner.associatedCompanies?.join(', ')}
                          </div>
                          {partner.name}
                        </TableCell>
                        <TableCell>{partner.cpf}</TableCell>
                        <TableCell>
                          <Badge variant={partner.hasECPF ? 'default' : 'secondary'}>
                            {partner.hasECPF ? 'Sim' : 'Não'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col space-y-1">
                             {partner.hasECPF ? (
                               <>
                                <Badge variant={certStatus.variant} className="gap-1.5 whitespace-nowrap w-fit">
                                  <certStatus.Icon className="h-3 w-3" />
                                  {certStatus.text}
                                </Badge>
                                <div className="text-xs text-muted-foreground">{certStatus.dateText}</div>
                                </>
                             ) : (
                                <span className="text-muted-foreground">N/A</span>
                             )}
                           </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="icon" onClick={() => handleOpenDetails(partner)}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ver Detalhes</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum sócio encontrado. Adicione um ou sincronize para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
