
'use client';

import { Home, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { SidebarTrigger } from '../ui/sidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';

type AppHeaderProps = {
  pageTitle: string;
};

export function AppHeader({ pageTitle }: AppHeaderProps) {
  const { auth, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  const userAvatar = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
      <SidebarTrigger className="sm:hidden" />
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
        <ChevronsRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{pageTitle}</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="overflow-hidden rounded-full h-8 w-8">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || userAvatar?.imageUrl} alt="Avatar" data-ai-hint={userAvatar?.imageHint}/>
                <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/perfil">Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
