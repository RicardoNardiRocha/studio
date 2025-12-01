import { Home, Search, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

type AppHeaderProps = {
  pageTitle: string;
};

export function AppHeader({ pageTitle }: AppHeaderProps) {
  const userAvatar = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground"><Home className="h-4 w-4" /></Link>
        <ChevronsRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{pageTitle}</span>
      </div>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar em todo o sistema..."
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar?.imageUrl} alt="Avatar" data-ai-hint={userAvatar?.imageHint}/>
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuItem>Suporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
