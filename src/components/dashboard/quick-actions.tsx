'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building, Workflow, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Ações Rápidas</CardTitle>
                <CardDescription>Atalhos para as tarefas mais comuns.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
                <Button asChild variant="outline">
                    <Link href="/empresas">
                        <Building className="mr-2 h-4 w-4" /> Cadastrar Empresa
                    </Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href="/processos">
                        <Workflow className="mr-2 h-4 w-4" /> Criar Processo
                    </Link>
                </Button>
                 <Button asChild variant="outline">
                    <Link href="/obrigacoes">
                       <ShieldCheck className="mr-2 h-4 w-4" /> Lançar Obrigação
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
