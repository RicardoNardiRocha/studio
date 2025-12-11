
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se não estiver carregando e não houver usuário, redireciona para login.
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

  // Enquanto carrega o usuário ou o perfil (após a verificação inicial do auth), mostra a tela de loading.
  if (isUserLoading || (user && !profile)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validando acesso...</p>
      </div>
    );
  }
  
  // Se não houver usuário (e não estiver na página de login), retorna null para evitar piscar.
  if (!user && pathname !== '/login') {
      return null;
  }

  // Se o usuário estiver logado, mas o perfil ainda não carregou, continue mostrando o loading.
  // Isso cobre o caso em que o `onAuthStateChanged` já rodou, mas a busca no firestore está pendente.
  if(user && !profile) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  // Se o usuário estiver na página de login, mas já autenticado, ele será redirecionado pelo useEffect.
  // Renderiza a página de login se não houver usuário.
  if (!user && pathname === '/login') {
    return <>{children}</>;
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
