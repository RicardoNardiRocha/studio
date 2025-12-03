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
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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

type EcpfStatusFilter = 'Todos' | 'Sim' | 'Não';
const ecpfStatusOptions: EcpfStatusFilter[] = ['Todos', 'Sim', 'Não'];

export default function SocietarioPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ecpfFilter, setEcpfFilter] = useState<EcpfStatusFilter>('Todos');

  const firestore = useFirestore();

  const partnersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'partners'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: partners, isLoading } = useCollection<Partner>(partnersCollection);
  
  const filteredPartners = useMemo(() => {
    if (!partners) return [];
    return partners.filter(partner => {
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = partner.name.toLowerCase().includes(searchTermLower) || partner.cpf.includes(searchTerm);

      const ecpfMatch = ecpfFilter === 'Todos' || (ecpfFilter === 'Sim' && partner.hasECPF) || (ecpfFilter === 'Não' && !partner.hasECPF);

      return searchMatch && ecpfMatch;
    });
  }, [partners, searchTerm, ecpfFilter]);


  const handleAction = () => {
    // A lista será atualizada automaticamente pelo useCollection.
    // Esta função fecha o modal para garantir que, ao reabrir, os dados estejam atualizados.
    setIsDetailsDialogOpen(false);
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">
                Cadastro de Sócios e Administradores
              </CardTitle>
              <CardDescription>
                Gerencie os sócios e administradores de todas as empresas.
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Sócio
            </Button>
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
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredPartners && filteredPartners.length > 0 ? (
                  filteredPartners.map((partner) => (
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
                        {partner.ecpfValidity
                          ? new Date(partner.ecpfValidity + 'T00:00:00-03:00').toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => handleOpenDetails(partner)}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ver Detalhes</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum sócio encontrado. Adicione um para começar.
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
