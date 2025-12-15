
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isUserLoading, userError } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isUserLoading) {
      return; // Aguarda o carregamento do usuário e perfil antes de tomar qualquer decisão.
    }

    // Cenário 1: Usuário não está logado.
    if (!user) {
      // Se não estiver na página de login, redireciona para lá.
      if (pathname !== '/') {
        router.replace('/');
      }
      return;
    }

    // Cenário 2: Usuário está logado e o perfil foi carregado.
    if (user && profile) {
      // Se está na página de login, decide para onde redirecionar.
      if (pathname === '/') {
        if (profile.permissions?.dashboard?.read) {
          router.replace('/dashboard'); // Tem permissão? Vai para o dashboard.
        } else {
          router.replace('/perfil'); // Não tem? Vai para o perfil.
        }
        return;
      }
      
      // Se está em qualquer outra página e não tem permissão para o dashboard, força para o perfil.
      if (!profile.permissions?.dashboard?.read && pathname !== '/perfil') {
        router.replace('/perfil');
        return;
      }
      
      // Proteção específica para o módulo financeiro.
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
  
  // Renderiza a página de login se for o caso, ou o conteúdo protegido.
  if (pathname === '/' || (user && profile)) {
    // Caso especial para redirecionamento do financeiro enquanto a página carrega
    if (pathname.startsWith('/financeiro') && profile && !profile.permissions?.financeiro?.read) {
        return (
             <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Redirecionando...</p>
             </div>
        )
    }
    
    // Se for a página de login, renderiza o filho (a própria página de login).
    if (pathname === '/') {
        return <>{children}</>;
    }
    
    // Senão, renderiza o layout principal da aplicação.
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
