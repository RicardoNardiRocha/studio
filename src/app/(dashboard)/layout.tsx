
'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode } from 'react';
import { useUser } from '@/firebase';
import { Loader2, ArrowRightToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

// Importa o script de desenvolvimento para que ele seja carregado no ambiente do cliente.
import '@/lib/dev/set-admin';


function AppContent({ children }: { children: ReactNode }) {
    const { isCollapsed } = useSidebar();
    const isMobile = useIsMobile();

    const mainClass = cn(
      "transition-all duration-300 ease-in-out",
      isMobile ? 'ml-0' : (isCollapsed ? 'ml-16' : 'ml-56')
    )

    return (
        <main className={mainClass}>
            <div className="min-h-screen w-full">
                {children}
            </div>
        </main>
    );
}

function SidebarTrigger() {
    const { isCollapsed, toggleSidebar } = useSidebar();
    const isMobile = useIsMobile();

    if (isMobile || !isCollapsed) {
        return null;
    }

    return (
        <button
            onClick={toggleSidebar}
            className="group fixed top-1/2 left-14 z-40 flex h-24 w-4 -translate-y-1/2 items-center justify-center rounded-r-lg bg-sidebar/40 text-sidebar-foreground backdrop-blur-sm transition-all duration-300 ease-in-out hover:w-6 hover:bg-sidebar hover:backdrop-blur-none"
            aria-label="Expandir menu"
        >
            <ArrowRightToLine className="h-5 w-5 opacity-70 transition-opacity group-hover:opacity-100" />
        </button>
    );
}


export default function MainAppLayout({ children }: { children: ReactNode }) {
    const { user, profile, isUserLoading, userError } = useUser();
    const auth = useAuth();
    const isMobile = useIsMobile();

    if (isUserLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        );
    }

    if (userError) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center p-4 bg-background text-foreground">
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
            <div className="text-foreground bg-background">
                <AppSidebar />
                <SidebarTrigger />
                <AppContent>{children}</AppContent>
            </div>
        </SidebarProvider>
    );
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
