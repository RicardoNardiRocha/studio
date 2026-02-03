'use client';

import { PanelLeft, Search, User as UserIcon, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Joyride, { type Step, type CallBackProps, STATUS } from 'react-joyride';
import { GlobalSearchDialog } from './global-search-dialog';
import { useSidebar } from '@/components/ui/sidebar';
import { tourSteps } from '../tutorial/tour-steps';

export function AppHeader({ pageTitle }: { pageTitle: string }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    // Find the most specific path that matches
    const tourKey = Object.keys(tourSteps)
      .sort((a, b) => b.length - a.length)
      .find(key => pathname.startsWith(key));
    
    if (tourKey) {
      setSteps(tourSteps[tourKey]);
    } else {
      setSteps([]);
    }
  }, [pathname]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }
  };

  const handleHelpClick = () => {
    if (steps.length > 0) {
      setRunTour(true);
    } else {
      // If no tour is available for the current page, redirect to the full tutorial
      router.push('/tutorial');
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  return (
    <>
      <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <Joyride
        steps={steps}
        run={runTour}
        callback={handleJoyrideCallback}
        continuous
        showProgress
        showSkipButton
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Fim',
          next: 'Avançar',
          skip: 'Pular',
        }}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: 'hsl(var(--primary))',
            textColor: 'hsl(var(--foreground))',
            arrowColor: 'hsl(var(--card))',
            backgroundColor: 'hsl(var(--card))',
          },
          buttonClose: {
            color: 'hsl(var(--muted-foreground))',
          },
          buttonNext: {
            backgroundColor: 'hsl(var(--primary))',
          },
          buttonBack: {
            color: 'hsl(var(--muted-foreground))',
          },
        }}
      />
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mb-4">
        <Button size="icon" variant="outline" className="sm:hidden" onClick={toggleSidebar}>
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <div className="flex items-center">
          <h1 className="text-xl font-semibold md:text-2xl">{pageTitle}</h1>
        </div>

        <div className="relative ml-auto flex items-center gap-2">
           <div className="flex-1 md:grow-0">
               <Button 
                    variant="outline" 
                    className="w-full justify-start text-muted-foreground pl-8 md:w-[200px] lg:w-[336px]"
                    onClick={() => setIsSearchOpen(true)}
                >
                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" />
                    Buscar...
                     <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>
           </div>

            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full shrink-0"
              onClick={handleHelpClick}
            >
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Ajuda</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <UserIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/perfil')}>
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
    </>
  );
}
