import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ReactNode } from 'react';

export default function MainAppLayout({ children }: { children: ReactNode }) {

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
