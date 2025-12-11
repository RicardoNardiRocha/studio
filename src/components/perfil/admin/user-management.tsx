'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import Link from 'next/link';

export function UserManagement() {

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Adicione, remova e edite os usuários do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* User list will go here in the future */}
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gerenciamento de Perfis de Usuário</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Os usuários agora criam suas próprias contas na página de cadastro. Futuramente, você poderá gerenciar as permissões deles aqui.
            </p>
            <Button asChild variant="outline">
              <Link href="/signup">
                Ir para a Página de Cadastro
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
