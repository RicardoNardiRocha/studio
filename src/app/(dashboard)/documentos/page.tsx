'use client';

import { AppHeader } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo de Documentos" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="w-full max-w-lg text-center">
            <CardHeader>
              <CardTitle className="font-headline">Gerenciamento de Documentos por Empresa</CardTitle>
              <CardDescription>
                Para visualizar, adicionar ou gerenciar documentos, por favor, selecione uma empresa primeiro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Os documentos agora são organizados dentro de cada empresa, como se fossem pastas individuais.
              </p>
              <Button asChild>
                <Link href="/empresas">
                  <Building className="mr-2 h-4 w-4" />
                  Ir para o Módulo de Empresas
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
