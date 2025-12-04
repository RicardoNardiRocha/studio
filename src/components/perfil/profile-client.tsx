'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2, Camera } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !auth) {
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
            title: 'Arquivo muito grande',
            description: 'Por favor, selecione uma imagem com no máximo 5MB.',
            variant: 'destructive',
        });
        return;
    }

    setIsUploading(true);
    toast({ title: 'Enviando imagem...', description: 'Aguarde enquanto sua nova foto de perfil é enviada.' });

    try {
        const storage = getStorage(auth.app);
        const filePath = `profile-pictures/${user.uid}`;
        const fileRef = storageRef(storage, filePath);

        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);

        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: downloadURL });
            await auth.currentUser.reload();
        }
            
        toast({
            title: 'Foto de Perfil Atualizada!',
            description: 'Sua nova foto já está visível em todo o sistema.',
        });
        
    } catch (error: any) {
        console.error('Photo upload error:', error);
        toast({
            title: 'Erro no Upload',
            description: 'Não foi possível enviar sua foto. Verifique a configuração de CORS do bucket de Storage.',
            variant: 'destructive',
        });
    } finally {
        setIsUploading(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };


  const handleProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user || !auth || !auth.currentUser) return;
    setIsSavingProfile(true);

    try {
      if (user.displayName !== data.name) {
        await updateProfile(auth.currentUser, { displayName: data.name });
      }
      if (user.email !== data.email) {
        toast({
          title: 'Funcionalidade desabilitada',
          description: 'A alteração de e-mail está temporariamente desativada.',
          variant: 'destructive',
        });
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
    if (!user || !auth || !auth.currentUser) return;
    setIsSavingPassword(true);

    try {
      if(!user.email) throw new Error("Usuário sem e-mail não pode alterar senha.");
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, data.newPassword);
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
  
  const handleDeleteAccount = async () => {
      if (!user || !reauthPassword || !user.email || !auth.currentUser) {
          toast({title: 'Erro', description: 'Senha necessária para exclusão.', variant: 'destructive'});
          return;
      }
      setIsDeleting(true);
      try {
          const credential = EmailAuthProvider.credential(user.email, reauthPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          await deleteUser(auth.currentUser);
          toast({ title: 'Conta Excluída', description: 'Sua conta foi excluída permanentemente.' });
          if(auth) await signOut(auth);
          router.push('/signup');
      } catch (error: any) {
          toast({ title: 'Erro ao Excluir Conta', description: 'Sua senha está incorreta ou ocorreu um erro.', variant: 'destructive'});
      } finally {
          setIsDeleting(false);
      }
  }

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (!isClient || isUserLoading) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-24 w-24 rounded-full" />
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
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Atualize sua foto de perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
              <div className='relative'>
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.photoURL || undefined} alt="User Avatar" />
                    <AvatarFallback className='text-3xl'>
                        {user?.displayName?.substring(0, 2).toUpperCase() || 'AD'}
                    </AvatarFallback>
                </Avatar>
                 {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                )}
              </div>
            <div className='flex flex-col gap-2'>
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Camera className="mr-2 h-4 w-4" />
                    Alterar Foto
                </Button>
                <Input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                />
                <p className='text-xs text-muted-foreground'>JPG, GIF ou PNG. Tamanho máx. de 5MB.</p>
            </div>
          </div>
        </CardContent>
       </Card>

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
              <Input id="email" type="email" {...profileForm.register('email')} disabled />
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
      {user && (
        <div className="mt-4 text-right">
          <span className="text-xs text-muted-foreground select-all">UID: {user.uid}</span>
        </div>
      )}
    </div>
  );
}
