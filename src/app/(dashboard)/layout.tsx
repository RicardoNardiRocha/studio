
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode } from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export default function MainAppLayout({ children }: { children: ReactNode }) {
    const { user, profile, isUserLoading, userError } = useUser();
    const auth = useAuth();
    
    // AuthHandler no layout raiz agora cuida do redirecionamento.
    // Este layout apenas protege o conteúdo do dashboard.

    if (isUserLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        );
    }

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

    // Se o usuário não estiver logado ou o perfil não for carregado, o AuthHandler já terá redirecionionado.
    // Se ainda assim chegar aqui, não renderiza nada para evitar piscar de tela.
    if (!user || !profile) {
        return null;
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

