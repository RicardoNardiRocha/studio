'use client';

import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface Partner {
  nome_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
}

interface Company {
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
    qsa?: Partner[];
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    if (!status) return 'secondary';
    switch(status.toLowerCase()) {
        case 'ativa': return 'default';
        case 'inapta': return 'destructive';
        case 'baixada': return 'outline';
        default: return 'secondary';
    }
}

export function CompanyDetailsClient({ id }: { id: string }) {
  const firestore = useFirestore();

  const companyRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    const formattedId = id.replace(/[^\\d]/g, "");
    return doc(firestore, 'companies', formattedId);
  }, [firestore, id]);

  const { data: company, isLoading, error } = useDoc<Company>(companyRef);

  if (isLoading) {
      return (
          <>
            <AppHeader pageTitle="Carregando Empresa..." />
            <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
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
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </main>
          </>
      )
  }

  if ((!company && !isLoading) || error) {
    if (error) console.error(error);
    notFound();
  }
  
  if (!company) {
      return null;
  }


  return (
    <>
      <AppHeader pageTitle={`Detalhes: ${company.name}`} />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className='font-headline'>{company.name}</CardTitle>
                    <CardDescription>{company.fantasyName || 'Sem nome fantasia'}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <div>
                    <Label className='text-muted-foreground'>CNPJ</Label>
                    <p className="font-medium">{company.cnpj}</p>
                </div>
                <div>
                    <Label className='text-muted-foreground'>Data de Abertura</Label>
                    <p className="font-medium">{company.startDate}</p>
                </div>
                <div>
                    <Label className='text-muted-foreground'>Regime Tributário</Label>
                    <p className="font-medium">{company.taxRegime}</p>
                </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className='space-y-2'>
                    <h3 className="font-semibold font-headline">Endereço</h3>
                    <p className="text-sm text-muted-foreground">{company.address || 'Não informado'}</p>
                </div>
                <div className='space-y-2'>
                    <h3 className="font-semibold font-headline">Contato</h3>
                    <p className="text-sm text-muted-foreground">
                        Telefone: {company.phone || 'Não informado'} <br/>
                        Email: {company.email || 'Não informado'}
                    </p>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Quadro de Sócios e Administradores (QSA)</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Qualificação</TableHead>
                            <TableHead>Data de Entrada</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {company.qsa && company.qsa.length > 0 ? (
                            company.qsa.map((socio, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{socio.nome_socio}</TableCell>
                                    <TableCell>{socio.qualificacao_socio}</TableCell>
                                    <TableCell>{new Date(socio.data_entrada_sociedade).toLocaleDateString('pt-BR')}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    Nenhum sócio ou administrador encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Informações Adicionais (Interno)</CardTitle>
                <CardDescription>Dados para controle do escritório.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="employee-count">Número de Funcionários</Label>
                        <Input id="employee-count" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pro-labore">Valor do Pró-labore (R$)</Label>
                        <Input id="pro-labore" type="number" placeholder="0,00" />
                    </div>
                </div>
                 <Button>Salvar Informações</Button>
            </CardContent>
          </Card>
      </main>
    </>
  );
}
