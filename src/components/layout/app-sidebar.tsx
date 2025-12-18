'use client';

import {
  ArrowLeftToLine,
  ArrowRightToLine,
  BarChartBig,
  Building,
  Briefcase,
  Workflow,
  ShieldCheck,
  FileCog,
  FolderOpen,
  Landmark,
  User,
  Layers,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUser } from '@/firebase';
import type { UserProfile } from '@/firebase/provider';
import { useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import { Separator } from '../ui/separator';

const mainMenuItems = [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: BarChartBig },
    { id: 'empresas', href: '/empresas', label: 'Empresas', icon: Building },
    { id: 'societario', href: '/societario', label: 'Societário', icon: Briefcase },
    { id: 'processos', href: '/processos', label: 'Processos', icon: Workflow },
    { id: 'obrigacoes', href: '/obrigacoes', label: 'Obrigações', icon: ShieldCheck },
    { id: 'fiscal', href: '/fiscal', label: 'Fiscal', icon: FileCog },
    { id: 'documentos', href: '/documentos', label: 'Documentos', icon: FolderOpen },
    { id: 'financeiro', href: '/financeiro', label: 'Financeiro', icon: Landmark },
];

const settingsMenuItems = [
    { id: 'usuarios', href: '/usuarios', label: 'Usuários', icon: Users },
]

const hasAccess = (itemId: string, profile: UserProfile | null): boolean => {
    if (!profile || !profile.permissions) return false;
    
    const moduleKey = itemId as keyof UserProfile['permissions'];
    const permission = profile.permissions[moduleKey];
    
    // O dashboard é especial e sempre visível se a permissão de leitura existir.
    if (itemId === 'dashboard') return permission?.read === true;
    
    return !!permission?.read;
};


const NavLink = ({ href, label, icon: Icon, isCollapsed, pathname }: { href: string, label: string, icon: React.ElementType, isCollapsed: boolean, pathname: string }) => (
    <Link href={href}>
        <div
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-sidebar-accent ${
                pathname.startsWith(href) ? 'bg-sidebar-accent text-sidebar-primary-foreground' : ''
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? label : undefined}
        >
            <Icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{label}</span>}
        </div>
    </Link>
);


export function AppSidebar() {
  const pathname = usePathname();
  const { user, profile } = useUser();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const visibleMainMenuItems = mainMenuItems.filter(item => hasAccess(item.id, profile));
  const visibleSettingsMenuItems = settingsMenuItems.filter(item => hasAccess(item.id, profile));

  return (
      <aside
        className={`group fixed top-0 left-0 h-full z-30 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
        data-state={isCollapsed ? 'collapsed' : 'expanded'}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
            <Link href="/dashboard" className={`flex items-center gap-2 ${isCollapsed ? 'w-full justify-center' : ''}`}>
                <Layers className="h-7 w-7 text-sidebar-primary" />
                {!isCollapsed && <h1 className="text-xl font-bold">ContabilX</h1>}
            </Link>
             <button onClick={toggleSidebar} className={`p-1 text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[state=collapsed]:hidden`}>
                <ArrowLeftToLine className="h-5 w-5" />
            </button>
        </header>

        <nav className="flex-grow space-y-1 p-2">
          {visibleMainMenuItems.map((item) => (
            <NavLink key={item.id} {...item} isCollapsed={isCollapsed} pathname={pathname} />
          ))}
        </nav>

        <footer className="shrink-0 border-t border-sidebar-border p-2 space-y-2">
            <div className={`flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''}`}>
                {visibleSettingsMenuItems.map(item => (
                     <NavLink key={item.id} {...item} isCollapsed={isCollapsed} pathname={pathname} />
                ))}
            </div>

            <Separator className='bg-sidebar-border' />

            <div className={`flex items-center ${isCollapsed ? 'justify-start' : 'justify-start'}`}>
                <ThemeToggle />
            </div>
            
            <Separator className='bg-sidebar-border' />

            <Link href="/perfil">
                <div className={`flex items-center gap-3 rounded-md p-2 ${isCollapsed ? 'justify-center' : ''}`}>
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={user?.photoURL || ''} alt="User avatar" />
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="truncate font-semibold text-sm">{user?.displayName || 'Usuário'}</p>
                            <p className="truncate text-xs text-sidebar-foreground/70">{user?.email || 'email@exemplo.com'}</p>
                        </div>
                    )}
                </div>
            </Link>
        </footer>
      </aside>
  );
}
