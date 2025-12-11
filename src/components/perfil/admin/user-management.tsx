'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle } from 'lucide-react';

export function UserManagement() {

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>Visualize e edite os perfis de usuários do sistema.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lista de Usuários</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Em breve: A lista de todos os usuários que já fizeram login aparecerá aqui, permitindo que você edite suas permissões.
            </p>
             <p className="text-xs text-muted-foreground">
              Para adicionar um novo usuário, crie suas credenciais no painel do Firebase Authentication. Ao fazer o primeiro login, o perfil dele será criado automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
