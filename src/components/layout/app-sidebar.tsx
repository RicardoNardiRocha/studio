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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUser } from '@/firebase';
import type { UserProfile } from '@/firebase/provider';
import { useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from './theme-toggle';

const allMenuItems = [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: BarChartBig },
    { id: 'empresas', href: '/empresas', label: 'Empresas', icon: Building },
    { id: 'societario', href: '/societario', label: 'Societário', icon: Briefcase },
    { id: 'processos', href: '/processos', label: 'Processos', icon: Workflow },
    { id: 'obrigacoes', href: '/obrigacoes', label: 'Obrigações', icon: ShieldCheck },
    { id: 'fiscal', href: '/fiscal', label: 'Fiscal', icon: FileCog },
    { id: 'documentos', href: '/documentos', label: 'Documentos', icon: FolderOpen },
    { id: 'financeiro', href: '/financeiro', label: 'Financeiro', icon: Landmark },
    { id: 'perfil', href: '/perfil', label: 'Perfil', icon: User },
];

const hasAccess = (itemId: string, profile: UserProfile | null): boolean => {
    if (!profile || !profile.permissions) return false;
    if (itemId === 'dashboard' || itemId === 'perfil') return true;
    const moduleKey = itemId as keyof UserProfile['permissions'];
    return profile.permissions[moduleKey]?.read === true;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, profile } = useUser();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const visibleMenuItems = allMenuItems.filter(item => hasAccess(item.id, profile));

  return (
    <>
      <aside
        className={`group fixed top-0 left-0 h-full z-30 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <header className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
            <div className={`flex items-center gap-2 ${isCollapsed ? 'w-full justify-center' : ''}`}>
                <Layers className="h-7 w-7 text-sidebar-primary" />
                {!isCollapsed && <h1 className="text-xl font-bold">ContabilX</h1>}
            </div>
        </header>

        <nav className="flex-grow space-y-1 p-2">
          {visibleMenuItems.map((item) => (
            <Link href={item.href} key={item.href}>
              <div
                className={`flex h-10 items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-sidebar-accent ${
                  pathname.startsWith(item.href) ? 'bg-sidebar-accent' : ''
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        <footer className="shrink-0 border-t border-sidebar-border p-2">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} mb-2`}>
                <ThemeToggle />
            </div>
            <div className={`flex items-center gap-3 rounded-md p-2 ${isCollapsed ? 'justify-center' : ''}`}>
                <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={user?.photoURL || ''} alt="User avatar" />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <p className="truncate font-semibold text-sm">{user?.displayName || 'Usuário'}</p>
                        <p className="truncate text-xs text-gray-400">{user?.email || 'email@exemplo.com'}</p>
                    </div>
                )}
            </div>
        </footer>
      </aside>

      {/* Botão de Controle Unificado e "Colado" */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-1/2 z-40 flex h-24 w-2 -translate-y-1/2 items-center justify-center rounded-r-lg bg-gray-800/60 text-white backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-primary/80 hover:w-6 ${
            isCollapsed ? 'left-16' : 'left-56'
        }`}
        aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <div className="h-full w-full flex items-center justify-center">
         {isCollapsed ? (
          <ArrowRightToLine className="h-5 w-5" />
        ) : (
          <ArrowLeftToLine className="h-5 w-5" />
        )}
        </div>
      </button>
    </>
  );
}
