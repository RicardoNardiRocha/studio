'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, profile, isUserLoading, userError } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  useEffect(() => {
    // Não faça nada enquanto carrega
    if (isUserLoading) {
      return; 
    }

    // Se, após o carregamento, houver um erro de perfil
    if (userError) {
       toast({
        title: 'Erro de Perfil',
        description: userError.message || "Seu perfil não foi encontrado ou está incompleto. Contate o administrador.",
        variant: 'destructive',
      });
       router.replace('/login');
       return;
    }

    // Se, após o carregamento, não houver usuário autenticado
    if (!user) {
      if(pathname !== '/login') {
          router.replace('/login');
      }
      return;
    }
    
    // Se há um usuário autenticado mas o perfil ainda não carregou (aguarde)
    if(user && !profile) {
      return;
    }

    // Se o usuário está logado, com perfil, mas na página de login, redirecione para o dashboard
    if(user && profile && pathname === '/login'){
        router.replace('/dashboard');
    }

  }, [isUserLoading, user, profile, userError, router, pathname, toast]);


  // Mostra a tela de carregamento enquanto o estado de autenticação/perfil é resolvido
  if (isUserLoading || (user && !profile && !userError)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validando acesso...</p>
      </div>
    );
  }

  // Se, após tudo, não houver usuário ou perfil (e não houver erro sendo tratado pelo useEffect),
  // não renderize nada para evitar piscar a tela antes do redirecionamento.
  if(!user || !profile){
    return null;
  }
  
  // Se tudo estiver OK, mostre o conteúdo da aplicação.
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
