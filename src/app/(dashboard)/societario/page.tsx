'use client';

import { useState, useMemo } from 'react';
import { AppHeader } from '@/components/layout/header';
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
import { MoreHorizontal, PlusCircle, Search, ShieldCheck, ShieldX, ShieldQuestion, RefreshCw, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, parseISO, isValid } from 'date-fns';

type EcpfStatusFilter = 'Todos' | 'Sim' | 'Não';
const ecpfStatusOptions: EcpfStatusFilter[] = ['Todos', 'Sim', 'Não'];

type ValidityStatus = 'Válido' | 'Vencendo em 30 dias' | 'Vencido' | 'Não informado';
const validityStatusOptions: Array<'Todos' | ValidityStatus> = ['Todos', 'Válido', 'Vencendo em 30 dias', 'Vencido', 'Não informado'];

const getCertificateStatusInfo = (validity?: string): { text: string; status: ValidityStatus; variant: 'default' | 'destructive' | 'secondary'; daysLeft?: number, Icon: React.ElementType, dateText: string } => {
  if (!validity) {
    return { text: 'Não informado', status: 'Não informado', variant: 'secondary', Icon: ShieldQuestion, dateText: 'N/A' };
  }
  try {
    const validityDate = parseISO(validity + 'T00:00:00-03:00');
    if (!isValid(validityDate)) {
        return { text: 'Data inválida', status: 'Não informado', variant: 'secondary', Icon: ShieldQuestion, dateText: 'Inválida' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = differenceInDays(validityDate, today);
    const dateText = validityDate.toLocaleDateString('pt-BR');

    if (daysLeft < 0) {
      return { text: 'Vencido', status: 'Vencido', variant: 'destructive', daysLeft, Icon: ShieldX, dateText };
    }
    if (daysLeft <= 30) {
      return { text: `Vence em ${daysLeft}d`, status: 'Vencendo em 30 dias', variant: 'destructive', daysLeft, Icon: ShieldCheck, dateText };
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

  const firestore = useFirestore();
  const { toast } = useToast();

  const partnersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partners'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: partners, isLoading, forceRefetch } = useCollection<Partner>(partnersCollection);

  const handleSyncPartners = async () => {
    if (!firestore) {
        toast({ title: "Erro", description: "Serviço de banco de dados indisponível.", variant: "destructive" });
        return;
    }
    setIsSyncing(true);
    toast({ title: "Iniciando sincronização...", description: "Buscando sócios em todas as empresas cadastradas." });

    let partnersAdded = 0;
    let partnersUpdated = 0;
    
    try {
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));

        // 1. Build a map of all partners and their associated companies from all QSAs
        const partnerToCompanyMap = new Map<string, { name: string; cpf: string; companies: Set<string> }>();

        companiesSnapshot.docs.forEach(companyDoc => {
            const companyData = companyDoc.data();
            if (companyData.qsa && Array.isArray(companyData.qsa)) {
                companyData.qsa.forEach((socio: any) => {
                    const partnerCpf = socio.cpf_representante_legal?.replace(/[^\d]/g, '');
                    if (!partnerCpf || partnerCpf.length !== 11) return;

                    if (!partnerToCompanyMap.has(partnerCpf)) {
                        partnerToCompanyMap.set(partnerCpf, {
                            name: socio.nome_socio,
                            cpf: socio.cpf_representante_legal,
                            companies: new Set()
                        });
                    }
                    partnerToCompanyMap.get(partnerCpf)!.companies.add(companyData.name);
                });
            }
        });

        // 2. Iterate through the map and update/create partners in Firestore
        for (const [partnerId, partnerData] of partnerToCompanyMap.entries()) {
            const partnerRef = doc(firestore, 'partners', partnerId);
            const partnerDoc = await getDoc(partnerRef);

            if (partnerDoc.exists()) {
                // Partner exists, update their associated companies
                const existingData = partnerDoc.data() as Partner;
                const existingCompanies = new Set(existingData.associatedCompanies || []);
                const originalSize = existingCompanies.size;

                partnerData.companies.forEach(companyName => existingCompanies.add(companyName));

                if (existingCompanies.size > originalSize) {
                    await setDoc(partnerRef, { associatedCompanies: Array.from(existingCompanies) }, { merge: true });
                    partnersUpdated++;
                }
            } else {
                // Partner does not exist, create a new one
                const newPartner: Partner = {
                    id: partnerId,
                    name: partnerData.name,
                    cpf: partnerData.cpf,
                    hasECPF: false,
                    ecpfValidity: '',
                    govBrLogin: '',
                    govBrPassword: '',
                    associatedCompanies: Array.from(partnerData.companies),
                    otherData: '',
                };
                await setDoc(partnerRef, newPartner);
                partnersAdded++;
            }
        }
        
        toast({ title: "Sincronização Concluída!", description: `${partnersAdded} sócio(s) novo(s) adicionado(s) e ${partnersUpdated} cadastro(s) atualizado(s).` });
        forceRefetch();

    } catch (error: any) {
        console.error("Erro ao sincronizar sócios:", error);
        toast({ title: "Erro na Sincronização", description: error.message || "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
        setIsSyncing(false);
    }
  };
  
  const filteredPartners = useMemo(() => {
    if (!partners) return [];
    return partners.filter(partner => {
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = partner.name.toLowerCase().includes(searchTermLower) || partner.cpf.includes(searchTerm);

      const ecpfMatch = ecpfFilter === 'Todos' || (ecpfFilter === 'Sim' && partner.hasECPF) || (ecpfFilter === 'Não' && !partner.hasECPF);

      const validityMatch = validityFilter === 'Todos' || getCertificateStatusInfo(partner.ecpfValidity).status === validityFilter;

      return searchMatch && ecpfMatch && validityMatch;
    });
  }, [partners, searchTerm, ecpfFilter, validityFilter]);


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
      <AddPartnerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onPartnerAdded={handleAction}
      />
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

      <AppHeader pageTitle="Módulo Societário" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
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
                 <Button onClick={handleSyncPartners} variant="outline" disabled={isSyncing}>
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Sincronizar Sócios
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
                  placeholder="Buscar por nome ou CPF..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                <Select value={validityFilter} onValueChange={setValidityFilter}>
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
                  <TableHead>Nome do Sócio</TableHead>
                  <TableHead>CPF</TableHead>
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
                    return (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium">
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
