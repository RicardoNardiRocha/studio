
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
    if (!isUserLoading && !user) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    if (user && profile && pathname === '/login') {
      router.replace('/dashboard');
    }

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

  if (user && !profile) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-destructive" />
        <p className="text-destructive">Erro de Perfil. Seu perfil não foi encontrado ou está incompleto. Contate o administrador.</p>
        <p className="text-sm text-muted-foreground">{userError?.message}</p>
      </div>
    )
  }

  if (!user && pathname !== '/login') {
      return null;
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (user && profile) {
    if (pathname.startsWith('/financeiro') && !profile.permissions?.financeiro?.read) {
        return (
             <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
