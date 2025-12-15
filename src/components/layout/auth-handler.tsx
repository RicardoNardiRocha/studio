
'use client';

import { useUser, useAuth } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

export function AuthHandler({ children }: { children: ReactNode }) {
  const { user, profile, isUserLoading, userError } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Não faça nada enquanto os dados do usuário estiverem carregando.
    if (isUserLoading) {
      return;
    }

    const isAuthPage = pathname === '/';

    // Cenário 1: Usuário está logado e com perfil.
    if (user && profile) {
      // Se ele está na página de login, redirecione-o para dentro do app.
      if (isAuthPage) {
        if (profile.permissions?.dashboard?.read) {
          router.replace('/dashboard');
        } else {
          router.replace('/perfil'); // Se não tem acesso ao dashboard, vai para o perfil.
        }
        return;
      }

      // Proteção de módulo financeiro
      if (pathname.startsWith('/financeiro') && !profile.permissions?.financeiro?.read) {
        toast({
          title: 'Acesso Negado',
          description: "Você não tem permissão para acessar o módulo financeiro.",
          variant: 'destructive',
        });
        router.replace('/dashboard');
      }
    } 
    // Cenário 2: Usuário não está logado.
    else if (!user) {
      // Se ele tentar acessar qualquer página que não seja a de login, redirecione-o.
      if (!isAuthPage) {
        router.replace('/');
      }
    }

  }, [user, profile, isUserLoading, pathname, router, toast]);

  // Enquanto carrega, mostra uma tela de loading global para evitar piscar de conteúdo.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validando acesso...</p>
      </div>
    );
  }

  // Se houver um erro de perfil (ex: perfil removido), mostra uma tela de erro.
  if (userError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center p-4">
        <Loader2 className="h-8 w-8 text-destructive" />
        <p className="text-destructive font-semibold">Erro de Perfil</p>
        <p className="text-sm text-muted-foreground">{userError.message}</p>
        <Button onClick={() => auth && signOut(auth)}>Tentar Novamente</Button>
      </div>
    );
  }
  
  // Renderiza o conteúdo da página.
  return <>{children}</>;
}
