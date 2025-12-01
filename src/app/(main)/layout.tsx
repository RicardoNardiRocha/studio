import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/header';
import { ReactNode } from 'react';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  // We can get the page title from metadata or route, for now, we'll pass it down
  // This is a placeholder for a more dynamic title solution
  const getPageTitle = (child: any) => {
    // A more robust solution would inspect the route or child props
    return "Dashboard"; 
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
