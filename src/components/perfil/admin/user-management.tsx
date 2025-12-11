
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/firebase/provider';
import { Users, Shield, UserCog, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-log';
import { useUser } from '@/firebase';

export function UserManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user: adminUser } = useUser();
  const [updatingUsers, setUpdatingUsers] = useState<string[]>([]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('displayName', 'asc'));
  }, [firestore]);

  const { data: users, isLoading, error, forceRefetch } = useCollection<UserProfile>(usersQuery);

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
  }
  
  const handleTogglePermission = async (userToUpdate: UserProfile, permission: 'isAdmin' | 'canFinance') => {
    if (!firestore || !adminUser || adminUser.uid === userToUpdate.userId) {
        toast({ title: 'Ação não permitida', description: 'Você não pode alterar suas próprias permissões.', variant: 'destructive' });
        return;
    }

    setUpdatingUsers(prev => [...prev, userToUpdate.userId]);

    const userRef = doc(firestore, 'users', userToUpdate.userId);
    const newPermissionValue = !userToUpdate[permission];
    
    try {
        await updateDoc(userRef, { [permission]: newPermissionValue });
        toast({ title: 'Permissão atualizada!', description: `${userToUpdate.displayName} agora ${newPermissionValue ? 'tem' : 'não tem'} a permissão de ${permission === 'isAdmin' ? 'administrador' : 'financeiro'}.` });
        logActivity(firestore, adminUser, `alterou a permissão de ${permission} para ${newPermissionValue} para o usuário ${userToUpdate.displayName}.`);
        forceRefetch();
    } catch(err) {
        console.error("Permission update failed:", err);
        toast({ title: 'Erro', description: 'Não foi possível atualizar a permissão.', variant: 'destructive' });
    } finally {
        setUpdatingUsers(prev => prev.filter(id => id !== userToUpdate.userId));
    }
  };


  return (
    <>
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
                  <TableHead>Permissão</TableHead>
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
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(user.roleId)}>{user.roleId ? (user.roleId.charAt(0).toUpperCase() + user.roleId.slice(1)) : 'N/A'}</Badge>
                      </TableCell>
                       <TableCell>
                         <Button variant="ghost" size="sm" onClick={() => handleTogglePermission(user, 'isAdmin')} disabled={updatingUsers.includes(user.userId) || adminUser?.uid === user.userId}>
                            {updatingUsers.includes(user.userId) ? <Loader2 className='h-4 w-4 animate-spin' /> : (user.isAdmin ? <ToggleRight className='h-5 w-5 text-primary' /> : <ToggleLeft className='h-5 w-5 text-muted-foreground'/>)}
                         </Button>
                      </TableCell>
                       <TableCell>
                         <Button variant="ghost" size="sm" onClick={() => handleTogglePermission(user, 'canFinance')} disabled={updatingUsers.includes(user.userId) || adminUser?.uid === user.userId}>
                            {updatingUsers.includes(user.userId) ? <Loader2 className='h-4 w-4 animate-spin' /> : (user.canFinance ? <ToggleRight className='h-5 w-5 text-primary' /> : <ToggleLeft className='h-5 w-5 text-muted-foreground'/>)}
                         </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" disabled>
                          <UserCog className="h-4 w-4" />
                          <span className="sr-only">Editar Usuário</span>
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
