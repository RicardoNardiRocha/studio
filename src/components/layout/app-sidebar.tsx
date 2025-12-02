
'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  BarChartBig,
  Layers,
  Building,
  Briefcase,
  BookUser,
  ShieldCheck,
  FolderOpen,
  FileCog,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChartBig },
  { href: '/empresas', label: 'Empresas', icon: Building },
  { href: '/societario', label: 'Societário', icon: Briefcase },
  { href: '/obrigacoes', label: 'Obrigações', icon: ShieldCheck },
  { href: '/fiscal', label: 'Fiscal', icon: FileCog },
  { href: '/documentos', label: 'Documentos', icon: FolderOpen },
  { href: '/contabil', label: 'Contábil', icon: BookUser },
];

export function AppSidebar() {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Layers className="text-primary h-8 w-8" />
          <h1 className="text-xl font-bold font-headline text-sidebar-foreground">ContabilX</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <span className="flex items-center gap-2">
                    <item.icon />
                    <span className="text-base">{item.label}</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Admin</span>
            <span className="text-xs text-muted-foreground">admin@contaflow.com</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
