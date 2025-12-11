
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se está carregando, não faz nada ainda.
    if (isUserLoading) {
      return;
    }

    // Se terminou de carregar e não há usuário ou perfil, redireciona para login.
    if (!user || !profile) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    // Se o usuário está logado e com perfil, mas na página de login, redireciona para o dashboard.
    if (user && profile && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, profile, isUserLoading, pathname, router]);

  // Enquanto carrega o usuário ou o perfil, mostra a tela de loading.
  if (isUserLoading || (auth.currentUser && !profile)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validando acesso...</p>
      </div>
    );
  }

  // Se, após o carregamento, não houver usuário ou perfil (e não estiver na página de login),
  // não renderiza nada para evitar piscar a tela antes do redirecionamento.
  if (!user || !profile) {
     if (pathname !== '/login') {
       return null;
     }
  }

  // Se tudo estiver OK, mostra o conteúdo da aplicação.
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


export default function MainAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
