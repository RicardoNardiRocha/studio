'use client';

import { AppHeader } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface Partner {
  id: string;
  name: string;
  cpf: string;
  hasECPF: boolean;
  ecpfValidity: string;
  govBrLogin?: string;
  govBrPassword?: string;
  associatedCompanies?: string[];
  otherData?: string;
}

export function PartnerDetailsClient({ id }: { id: string }) {
  const firestore = useFirestore();

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'partners', id);
  }, [firestore, id]);

  const { data: partner, isLoading, error } = useDoc<Partner>(partnerRef);

  if (isLoading) {
    return (
      <>
        <AppHeader pageTitle="Carregando Sócio..." />
        <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  if ((!partner && !isLoading) || error) {
    if (error) console.error(error);
    notFound();
  }

  if (!partner) {
    return null;
  }

  return (
    <>
      <AppHeader pageTitle={`Detalhes: ${partner.name}`} />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{partner.name}</CardTitle>
            <CardDescription>CPF: {partner.cpf}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">E-CPF Ativo</Label>
                <p>
                  <Badge variant={partner.hasECPF ? 'default' : 'secondary'}>
                    {partner.hasECPF ? 'Sim' : 'Não'}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Validade do E-CPF</Label>
                <p className="font-medium">
                  {partner.ecpfValidity
                    ? new Date(partner.ecpfValidity).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Login GOV.BR</Label>
                <p className="font-medium">{partner.govBrLogin || 'Não informado'}</p>
              </div>
               <div>
                <Label className='text-muted-foreground'>Senha GOV.BR</Label>
                <p className="font-medium">{partner.govBrPassword ? '******' : 'Não informada'}</p>
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <h3 className="font-semibold font-headline">Empresas Associadas</h3>
              {partner.associatedCompanies && partner.associatedCompanies.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {partner.associatedCompanies.map((company, index) => (
                    <li key={index}>{company}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma empresa associada.</p>
              )}
            </div>

             <Separator />

            <div className='space-y-2'>
              <h3 className="font-semibold font-headline">Outros Dados do Sócio</h3>
              <p className="text-sm text-muted-foreground">{partner.otherData || 'Nenhuma informação adicional.'}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
