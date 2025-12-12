'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { UserProfile } from '@/firebase/provider';
import { Users, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditUserDialog } from './edit-user-dialog';

export function UserManagement() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const firestore = useFirestore();
  const { user: adminUser, profile: adminProfile } = useUser();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('displayName', 'asc'));
  }, [firestore]);

  const { data: users, isLoading, forceRefetch } = useCollection<UserProfile>(usersQuery);

  const getRoleSummary = (permissions: UserProfile['permissions']): string => {
    if (permissions?.usuarios?.update) return 'Admin';
    if (permissions?.empresas?.read) return 'Contador';
    return 'Usuário';
  };

  const handleOpenEditDialog = (userToEdit: UserProfile) => {
    setSelectedUser(userToEdit);
    setIsEditDialogOpen(true);
  };
  
  const handleUserUpdated = () => {
    forceRefetch();
  }
  
  const canEdit = (userToEdit: UserProfile) => {
    if (!adminProfile || !adminUser) return false;
    if (adminUser.uid === userToEdit.uid) return false;
    // Simple logic: only admins can edit other users
    return adminProfile.permissions?.usuarios?.update === true;
  }

  return (
    <>
      {selectedUser && (
        <EditUserDialog
          userToEdit={selectedUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUserUpdated={handleUserUpdated}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>Visualize e edite os perfis e permissões dos usuários do sistema.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 p-4 border-l-4 rounded-md bg-muted">
            <b>Como funciona:</b> Para que um novo usuário apareça nesta lista, ele deve primeiro ser criado no painel do <b>Firebase Authentication</b>. Após o primeiro login no aplicativo, seu perfil será automaticamente criado aqui com permissões padrão, e então você poderá gerenciá-lo.
          </p>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função Resumida</TableHead>
                  <TableHead>Acessa Financeiro?</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleSummary(user.permissions) === 'Admin' ? 'default' : 'secondary'}>
                          {getRoleSummary(user.permissions)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.permissions?.financeiro?.read ? 'default' : 'outline'}>
                          {user.permissions?.financeiro?.read ? 'Sim' : 'Não'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => handleOpenEditDialog(user)} disabled={!canEdit(user)}>
                          <UserCog className="h-4 w-4" />
                          <span className="sr-only">Gerenciar Permissões</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      Nenhum perfil de usuário encontrado no banco de dados.
                      <p className='text-xs text-muted-foreground'>Faça o primeiro login de um novo usuário para que ele apareça aqui.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
