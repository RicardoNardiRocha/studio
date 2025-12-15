
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isUserLoading, userError } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Se não está carregando e não há usuário, manda para a página inicial (login)
    if (!isUserLoading && !user) {
      if (pathname !== '/') {
        router.replace('/');
      }
      return;
    }

    // Se usuário está logado, com perfil, e está na página de login, manda para o dashboard
    if (user && profile && pathname === '/') {
      router.replace('/dashboard');
    }
    
    // NOVO: Se o usuário logou, tem um perfil, mas não tem permissão para ver o dashboard,
    // manda ele para a página de perfil. Isso cobre o caso do primeiro login.
    if (user && profile && !profile.permissions?.dashboard?.read && pathname !== '/perfil') {
        router.replace('/perfil');
        return;
    }

    // Se tem permissão para o financeiro, mas está tentando acessar, nega e redireciona.
    if (user && profile) {
      if (pathname.startsWith('/financeiro') && !profile.permissions?.financeiro?.read) {
        toast({
          title: 'Acesso Negado',
          description: "Você não tem permissão para acessar este módulo.",
          variant: 'destructive',
        });
        router.replace('/dashboard');
      }
    }

  }, [user, profile, isUserLoading, pathname, router, toast]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validando acesso...</p>
      </div>
    );
  }

  // Se houve um erro ao carregar o perfil
  if (userError) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center p-4">
        <Loader2 className="h-8 w-8 text-destructive" />
        <p className="text-destructive font-semibold">Erro de Perfil</p>
        <p className="text-sm text-muted-foreground">{userError.message}</p>
        <Button onClick={() => auth && signOut(auth)}>Tentar Novamente</Button>
      </div>
    )
  }

  // Se não está logado e tenta acessar algo que não seja a página inicial
  if (!user && pathname !== '/') {
      return null;
  }

  // Se está na página de login, renderiza o conteúdo (a própria página de login)
  if (pathname === '/') {
    return <>{children}</>;
  }

  // Se o usuário está logado e tem perfil, mostra o layout principal
  if (user && profile) {
    // Caso especial para redirecionamento do financeiro
    if (pathname.startsWith('/financeiro') && !profile.permissions?.financeiro?.read) {
        return (
             <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Redirecionando...</p>
             </div>
        )
    }

    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-screen w-full flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return null;
}


export default function MainAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
