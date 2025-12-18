
'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserManagement } from '@/components/perfil/admin/user-management';
import { useUser } from '@/firebase';

export default function UsersPage() {
    const { profile } = useUser();

    if (!profile?.permissions.usuarios.read) {
        return (
             <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-6">
                <Card className='bg-destructive/10 border-destructive'>
                    <CardHeader>
                        <CardTitle>Acesso Negado</CardTitle>
                        <CardDescription className='text-destructive-foreground'>
                            Você não tem permissão para visualizar ou gerenciar usuários.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </main>
        )
    }

  return (
    <>
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-6">
        <UserManagement />
      </main>
    </>
  );
}
