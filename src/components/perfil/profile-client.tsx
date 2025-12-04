
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useUser } from '@/firebase';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  signOut,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const profileSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('O e-mail é inválido.'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
});

export function ProfileClient() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.displayName || '',
        email: user.email || '',
      });
    }
  }, [user, profileForm]);

  const handleProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user || !auth) return;
    setIsSavingProfile(true);

    try {
      if (user.displayName !== data.name) {
        await updateProfile(user, { displayName: data.name });
      }
      if (user.email !== data.email) {
        // Reautenticação é necessária para mudar o e-mail
        toast({
          title: 'Reautenticação Necessária',
          description: 'Para alterar seu e-mail, por favor, digite sua senha atual na caixa de diálogo de exclusão e tente novamente.',
          variant: 'destructive',
        });
        // Simplificação: usar o mesmo modal de reautenticação da exclusão
      }
      toast({
        title: 'Perfil Atualizado',
        description: 'Seu nome foi atualizado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao Atualizar Perfil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!user || !auth) return;
    setIsSavingPassword(true);

    try {
      if(!user.email) throw new Error("Usuário sem e-mail não pode alterar senha.");
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);
      toast({
        title: 'Senha Alterada',
        description: 'Sua senha foi alterada com sucesso.',
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: 'Erro ao Alterar Senha',
        description: 'A senha atual está incorreta ou ocorreu um erro.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };
  
  const handleDeleteAccount = async () => {
      if (!user || !reauthPassword || !user.email) {
          toast({title: 'Erro', description: 'Senha necessária para exclusão.', variant: 'destructive'});
          return;
      }
      setIsDeleting(true);
      try {
          const credential = EmailAuthProvider.credential(user.email, reauthPassword);
          await reauthenticateWithCredential(user, credential);
          await deleteUser(user);
          toast({ title: 'Conta Excluída', description: 'Sua conta foi excluída permanentemente.' });
          router.push('/signup');
      } catch (error: any) {
          toast({ title: 'Erro ao Excluir Conta', description: 'Sua senha está incorreta ou ocorreu um erro.', variant: 'destructive'});
      } finally {
          setIsDeleting(false);
      }
  }

  if (isUserLoading) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
          <CardDescription>Atualize seu nome e endereço de e-mail.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...profileForm.register('email')} />
               {profileForm.formState.errors.email && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>Para sua segurança, você precisa informar sua senha atual.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento da Conta</CardTitle>
          <CardDescription>Ações importantes relacionadas à sua conta.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col sm:flex-row gap-4'>
            <Button variant="outline" onClick={handleLogout}>Sair da Conta</Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Excluir Conta</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá seus dados de nossos servidores. Para confirmar, digite sua senha atual.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="reauth-password">Senha Atual</Label>
                        <Input 
                            id="reauth-password"
                            type="password"
                            value={reauthPassword}
                            onChange={(e) => setReauthPassword(e.target.value)}
                            placeholder="Digite sua senha para confirmar"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting || !reauthPassword}>
                             {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eu entendo, excluir minha conta
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>

    </div>
  );
}
