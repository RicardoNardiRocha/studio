
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

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChartBig },
  { href: '/empresas', label: 'Empresas', icon: Building },
  { href: '/societario', label: 'Societário', icon: Briefcase },
  { href: '/processos', label: 'Processos', icon: Workflow },
  { href: '/obrigacoes', label: 'Obrigações', icon: ShieldCheck },
  { href: '/fiscal', label: 'Fiscal', icon: FileCog },
  { href: '/documentos', label: 'Documentos', icon: FolderOpen },
  { href: '/financeiro', label: 'Financeiro', icon: Landmark },
];

const secondaryMenuItems = [
    { href: '/perfil', label: 'Perfil', icon: User },
]

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

  const processedPathname = pathname.split('/')[1] || 'dashboard';

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
          {secondaryMenuItems.map((item) => (
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
