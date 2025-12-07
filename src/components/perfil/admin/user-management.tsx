'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';
import { AddUserDialog } from './add-user-dialog';

export function UserManagement() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const handleUserAdded = () => {
    // For now, we just close the dialog. Later, we can refetch a user list.
    setIsAddUserOpen(false);
  };

  return (
    <>
      <AddUserDialog
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onUserAdded={handleUserAdded}
      />
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Adicione, remova e edite os usuários do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* User list will go here in the future */}
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lista de Usuários</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A funcionalidade de listar e editar usuários será implementada em breve.
            </p>
            <Button onClick={() => setIsAddUserOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Novo Usuário
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
