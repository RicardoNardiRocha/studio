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
    if (isUserLoading) {
      return; 
    }

    if (userError) {
       toast({
        title: 'Erro de Perfil',
        description: "Seu perfil não foi encontrado ou está incompleto. Contate o administrador.",
        variant: 'destructive',
      });
       router.replace('/login');
       return;
    }

    if (!user) {
      if(pathname !== '/login') {
          router.replace('/login');
      }
      return;
    }
    
    if(!profile) {
       toast({
        title: 'Validando Acesso...',
        description: "Aguarde enquanto validamos seu perfil.",
      });
      return;
    }

  }, [isUserLoading, user, profile, userError, router, pathname, toast]);


  if (isUserLoading || (!profile && user)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Validando acesso...</p>
      </div>
    );
  }

  if(!user || !profile){
    return null;
  }
  
  return <>{children}</>;
}


export default function MainAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-screen w-full flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
