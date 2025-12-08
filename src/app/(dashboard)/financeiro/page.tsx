
import { AppHeader } from '@/components/layout/header';
import { InvoicesClient } from '@/components/financeiro/invoices-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinanceiroPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo Financeiro" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <InvoicesClient />
        </Suspense>
      </main>
    </>
  );
}
