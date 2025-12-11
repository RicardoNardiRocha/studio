'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle } from 'lucide-react';
import { AddUserDialog } from '@/app/actions/create-user';

export function UserManagement() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  return (
    <>
       <AddUserDialog 
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onUserAdded={() => {
          // No futuro, podemos forçar a atualização da lista de usuários aqui
        }}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>Adicione e edite os perfis de usuários do sistema.</CardDescription>
          </div>
           <Button onClick={() => setIsAddUserOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        </CardHeader>
        <CardContent>
          {/* User list will go here in the future */}
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lista de Usuários</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Em breve, a lista de todos os perfis de usuários do sistema aparecerá aqui para gerenciamento de permissões.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
