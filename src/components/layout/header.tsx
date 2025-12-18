'use client';

import { PanelLeft, Search, User as UserIcon } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { AppSidebar } from './app-sidebar';
import { useState } from 'react';
import { GlobalSearchDialog } from './global-search-dialog';

export function AppHeader({ pageTitle }: { pageTitle: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  return (
    <>
      <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <div className="flex items-center">
          <h1 className="text-xl font-semibold md:text-2xl">{pageTitle}</h1>
        </div>

        <div className="relative ml-auto flex-1 md:grow-0">
            <Button 
                variant="outline" 
                className="w-full justify-start text-muted-foreground pl-8 md:w-[200px] lg:w-[336px]"
                onClick={() => setIsSearchOpen(true)}
            >
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" />
                Buscar...
            </Button>
        </div>

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
      </header>
    </>
  );
}
