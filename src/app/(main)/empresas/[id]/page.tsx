'use client';

import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { companies as initialCompanies } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Company {
    name: string;
    cnpj: string;
    status: string;
    taxRegime: string;
    startDate: string;
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


export default function CompanyDetailsPage({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findCompany = async () => {
        // First, try to find in the static list
        let foundCompany = initialCompanies.find((c) => c.cnpj.replace(/[^\d]/g, "") === params.id);

        if (foundCompany) {
            setCompany(foundCompany);
        } else {
            // If not found, fetch from the API
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    foundCompany = {
                        name: data.razao_social,
                        cnpj: data.cnpj,
                        taxRegime: data.opcao_pelo_simples ? 'Simples Nacional' : 'Não informado',
                        status: data.descricao_situacao_cadastral,
                        startDate: data.data_inicio_atividade,
                    };
                    setCompany(foundCompany);
                } else {
                    setCompany(null); // Explicitly set to null if not found
                }
            } catch (error) {
                console.error("Failed to fetch company data", error);
                setCompany(null); // Handle fetch error
            }
        }
        setLoading(false);
    };
    findCompany();
  }, [params.id]);

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
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
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
      <AppHeader pageTitle={`Detalhes da Empresa: ${company.name}`} />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className='font-headline'>{company.name}</CardTitle>
                    <CardDescription>{company.cnpj}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(company.status)}>{company.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <Label>Regime Tributário</Label>
                    <p className="text-sm font-medium">{company.taxRegime}</p>
                </div>
                <div>
                    <Label>Data de Início das Atividades</Label>
                    <p className="text-sm font-medium">{company.startDate}</p>
                </div>
            </div>
            
            <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium font-headline">Informações Adicionais</h3>
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
            </div>

          </CardContent>
        </Card>
      </main>
    </>
  );
}
