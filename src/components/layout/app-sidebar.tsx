
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
  FileText,
  Building,
  Users,
  Briefcase,
  BookUser,
  ShieldCheck,
  FolderOpen,
  MessageSquare,
  Landmark,
  FileCog,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: BarChartBig },
  { href: '/fiscal', label: 'Fiscal', icon: FileCog },
  { href: '/societario', label: 'Societário', icon: Briefcase },
  { href: '/empresas', label: 'Empresas', icon: Building },
  { href: '/financeiro', label: 'Financeiro', icon: Landmark },
  { href: '/contabil', label: 'Contábil', icon: BookUser },
  { href: '/dp', label: 'Dep. Pessoal', icon: Users },
  { href: '/obrigacoes', label: 'Obrigações', icon: ShieldCheck },
  { href: '/documentos', label: 'Documentos', icon: FolderOpen },
  { href: '/comunicacao', label: 'Comunicação', icon: MessageSquare },
];

export function AppSidebar() {
  const pathname = usePathname();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <FileText className="text-primary h-8 w-8" />
          <h1 className="text-xl font-bold font-headline text-sidebar-foreground">Eu vou enviar uma imagem para voce refazer a logo</h1>
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
