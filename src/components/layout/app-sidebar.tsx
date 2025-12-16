
'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  BarChartBig,
  Layers,
  Building,
  Briefcase,
  ShieldCheck,
  FolderOpen,
  FileCog,
  Workflow,
  User,
  Landmark,
  PanelLeft,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirebase } from '@/firebase';
import type { UserProfile } from '@/firebase/provider';


const allMenuItems = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: BarChartBig },
  { id: 'empresas', href: '/empresas', label: 'Empresas', icon: Building },
  { id: 'societario', href: '/societario', label: 'Societário', icon: Briefcase },
  { id: 'processos', href: '/processos', label: 'Processos', icon: Workflow },
  { id: 'obrigacoes', href: '/obrigacoes', label: 'Obrigações', icon: ShieldCheck },
  { id: 'fiscal', href: '/fiscal', label: 'Fiscal', icon: FileCog },
  { id: 'documentos', href: '/documentos', label: 'Documentos', icon: FolderOpen },
  { id: 'financeiro', href: '/financeiro', label: 'Financeiro', icon: Landmark },
];

const secondaryMenuItems = [
    { id: 'perfil', href: '/perfil', label: 'Perfil', icon: User },
];

const hasAccess = (itemId: string, profile: UserProfile | null): boolean => {
    if (!profile || !profile.permissions) return false;
    
    if (itemId === 'dashboard' || itemId === 'perfil') return true;

    // Adapta o nome do item do menu para corresponder à chave de permissão
    const moduleKey = itemId === 'societario' ? 'societario' : itemId;
    const module = moduleKey as keyof UserProfile['permissions'];
    
    // Verifica se o módulo existe nas permissões e se a leitura é permitida
    return profile.permissions[module] && profile.permissions[module]?.read === true;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, profile } = useUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

  const visibleMenuItems = allMenuItems.filter(item => hasAccess(item.id, profile));
  const visibleSecondaryMenuItems = secondaryMenuItems.filter(item => hasAccess(item.id, profile));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-2 p-2">
            <Layers className="text-primary h-8 w-8 shrink-0" />
            <h1 className="text-xl font-bold font-headline text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">ContabilX</h1>
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
            <SidebarTrigger>
                <PanelLeft />
            </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <span className="flex items-center gap-2">
                    <item.icon />
                    <span className="text-base group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
          {profile?.permissions?.usuarios?.read && visibleSecondaryMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                  className="justify-start"
                >
                  <span className="flex items-center gap-2">
                    <item.icon />
                    <span className="text-base group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="flex items-center gap-3 p-3 border-t border-sidebar-border overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:gap-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={user?.photoURL || userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
            <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sidebar-foreground truncate">{user?.displayName || 'Admin'}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email || 'admin@contabilx.com'}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
