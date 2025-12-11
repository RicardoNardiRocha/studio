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

  const getRoleVariant = (roleId?: string) => {
    switch (roleId) {
      case 'owner':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'contador':
        return 'secondary';
      default:
        return 'outline';
    }
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
    // Cannot edit self
    if(adminUser.uid === userToEdit.uid) return false;
    // Owners can edit anyone 
    if(adminProfile.roleId === 'owner') return true;
    // Admins can edit anyone who is not an owner or another admin
    if(adminProfile.roleId === 'admin' && userToEdit.roleId !== 'owner' && userToEdit.roleId !== 'admin') return true;
    
    return false;
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
                  <TableHead>Função</TableHead>
                  <TableHead>Admin?</TableHead>
                  <TableHead>Financeiro?</TableHead>
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
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(user.roleId)}>{user.roleId ? (user.roleId.charAt(0).toUpperCase() + user.roleId.slice(1)) : 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isAdmin ? 'default' : 'outline'}>{user.isAdmin ? 'Sim' : 'Não'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.canFinance ? 'default' : 'outline'}>{user.canFinance ? 'Sim' : 'Não'}</Badge>
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
                    <TableCell colSpan={6} className="h-24 text-center">
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
