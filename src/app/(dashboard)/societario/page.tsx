'use client';

import { useState } from 'react';
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AddPartnerDialog } from '@/components/societario/add-partner-dialog';
import { PartnerDetailsDialog } from '@/components/societario/partner-details-dialog';
import type { Partner } from '@/components/societario/partner-details-dialog';

export default function SocietarioPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const firestore = useFirestore();

  const partnersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'partners');
  }, [firestore]);

  const { data: partners, isLoading } = useCollection<Partner>(partnersCollection);

  const handlePartnerAdded = () => {
    // A lista será atualizada automaticamente pelo useCollection
  };

  const handleOpenDetails = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDetailsDialogOpen(true);
  };
  
  const handlePartnerAction = () => {
    // A lista será atualizada automaticamente pelo useCollection
    // Esta função pode ser usada tanto para updates quanto para deletes
  }

  return (
    <>
      <AddPartnerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onPartnerAdded={handlePartnerAdded}
      />
      {selectedPartner && (
        <PartnerDetailsDialog
          key={selectedPartner.id}
          partner={selectedPartner}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onPartnerUpdated={handlePartnerAction}
          onPartnerDeleted={handlePartnerAction}
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
                ) : partners && partners.length > 0 ? (
                  partners.map((partner) => (
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
          </CardContent>
        </Card>
      </main>
    </>
  );
}
