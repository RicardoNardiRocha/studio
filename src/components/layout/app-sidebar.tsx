
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
  ShieldCheck,
  FolderOpen,
  FileCog,
  Workflow,
  User,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
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

const hasAccess = (item: { id: string }, profile: UserProfile | null): boolean => {
    if (!profile) return false;

    const rules: { [key: string]: () => boolean } = {
        dashboard: () => true,
        empresas: () => profile.isAdmin || profile.roleId === 'owner' || profile.roleId === 'contador',
        societario: () => profile.isAdmin || profile.roleId === 'owner' || profile.roleId === 'contador',
        processos: () => profile.isAdmin || profile.roleId === 'owner' || profile.roleId === 'contador',
        obrigacoes: () => profile.isAdmin || profile.roleId === 'owner' || profile.roleId === 'contador',
        fiscal: () => profile.isAdmin || profile.roleId === 'owner',
        documentos: () => true, // Todos podem ver o placeholder do menu de documentos
        financeiro: () => profile.canFinance === true,
        perfil: () => true,
    };

    return rules[item.id] ? rules[item.id]() : false;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, profile } = useUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

  const visibleMenuItems = allMenuItems.filter(item => hasAccess(item, profile));
  const visibleSecondaryMenuItems = secondaryMenuItems.filter(item => hasAccess(item, profile));

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
                    <span className="text-base">{item.label}</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
          {visibleSecondaryMenuItems.map((item) => (
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
                    <span className="text-base">{item.label}</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="flex items-center gap-3 p-3 border-t border-sidebar-border">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
            <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sidebar-foreground truncate">{user?.displayName || 'Admin'}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email || 'admin@contabilx.com'}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
