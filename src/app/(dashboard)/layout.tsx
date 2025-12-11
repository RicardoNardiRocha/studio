
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isUserLoading, userError } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se o carregamento terminou e não há usuário, redireciona para login.
    if (!isUserLoading && !user) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    // Se o usuário estiver logado e na página de login, redireciona para o dashboard.
    if (user && profile && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, profile, isUserLoading, pathname, router]);

  // Durante o carregamento inicial, mostra a tela de loading.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validando acesso...</p>
      </div>
    );
  }

  // Após o carregamento, se há usuário mas não perfil, mostra o erro.
  if (user && !profile) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-destructive" />
        <p className="text-destructive">Erro de Perfil. Seu perfil não foi encontrado ou está incompleto. Contate o administrador.</p>
        <p className="text-sm text-muted-foreground">{userError?.message}</p>
      </div>
    )
  }

  // Se não houver usuário (e não estiver na página de login), retorna null para evitar piscar.
  if (!user && pathname !== '/login') {
      return null;
  }

  // Renderiza a página de login se for a rota de login.
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Se tudo estiver OK (usuário e perfil carregados), mostra a aplicação.
  if (user && profile) {
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

  // Fallback para o caso de o usuário não estar logado e estar numa rota protegida (o useEffect cuidará do redirect)
  return null;
}


export default function MainAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
