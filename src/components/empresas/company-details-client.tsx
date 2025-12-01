'use client';

import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { initialCompanies } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Separator } from '../ui/separator';

interface Partner {
  nome_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade: string;
}

interface Company {
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
  const [company, setCompany] = useState<Company | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findCompany = async () => {
        if (!id) return;
        setLoading(true);
        const formattedId = id.replace(/[^\d]/g, "");
        
        let foundCompany: Company | undefined | null = initialCompanies.find((c) => c.cnpj.replace(/[^\d]/g, "") === formattedId);

        if (foundCompany) {
            // Augment static data with API data for full details
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${formattedId}`);
                if (response.ok) {
                    const data = await response.json();
                    foundCompany = {
                        ...foundCompany,
                        fantasyName: data.nome_fantasia,
                        cnae: data.cnae_fiscal_descricao,
                        address: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`,
                        phone: data.ddd_telefone_1,
                        email: data.email,
                        capital: data.capital_social,
                        legalNature: data.natureza_juridica,
                        porte: data.porte,
                        qsa: data.qsa,
                    };
                }
            } catch (e) {
                // Ignore if API fails, just show static data
            }
            setCompany(foundCompany);
        } else {
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${formattedId}`);
                if (response.ok) {
                    const data = await response.json();
                    foundCompany = {
                        name: data.razao_social,
                        fantasyName: data.nome_fantasia,
                        cnpj: data.cnpj,
                        taxRegime: data.opcao_pelo_simples ? 'Simples Nacional' : (data.regime_tributario?.[0]?.forma_de_tributacao || 'Não informado'),
                        status: data.descricao_situacao_cadastral,
                        startDate: new Date(data.data_inicio_atividade).toLocaleDateString('pt-BR'),
                        cnae: data.cnae_fiscal_descricao,
                        address: `${data.logradouro}, ${data.numero}, ${data.complemento} - ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`,
                        phone: data.ddd_telefone_1,
                        email: data.email,
                        capital: data.capital_social,
                        legalNature: data.natureza_juridica,
                        porte: data.porte,
                        qsa: data.qsa,
                    };
                    setCompany(foundCompany);
                } else {
                    setCompany(null);
                }
            } catch (error) {
                console.error("Failed to fetch company data", error);
                setCompany(null);
            }
        }
        setLoading(false);
    };
    findCompany();
  }, [id]);

  if (loading) {
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

  if (!company) {
    notFound();
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
