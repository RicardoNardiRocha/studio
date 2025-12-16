
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode } from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function MainAppLayout({ children }: { children: ReactNode }) {
    const { user, profile, isUserLoading, userError } = useUser();
    const auth = useAuth();
    
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

    if (!user || !profile) {
        return null;
    }

    return (
        <SidebarProvider>
            <div className="relative flex">
                <AppSidebar />
                <div className="absolute left-[calc(var(--sidebar-width-icon)_-_0.5rem)] top-1/2 z-20 -translate-y-1/2 opacity-0 transition-all duration-300 group-data-[collapsible=icon]:opacity-100 group-hover/sidebar:opacity-100 group-hover/sidebar:left-[calc(var(--sidebar-width-icon)_-_0.5rem)] group-data-[collapsible=icon]:group-hover/sidebar:left-[calc(var(--sidebar-width-icon)_-_0.5rem)] group-data-[state=expanded]:left-[calc(var(--sidebar-width)_-_0.5rem)] group-data-[state=expanded]:opacity-0 group-data-[state=expanded]:group-hover/sidebar:opacity-0">
                    <SidebarTrigger className="h-24 w-6 rounded-r-full rounded-l-none p-1" />
                </div>
                <div className="flex-1">
                    <SidebarInset>
                        <div className="flex min-h-screen w-full flex-col">
                            {children}
                        </div>
                    </SidebarInset>
                </div>
            </div>
        </SidebarProvider>
    );
}
