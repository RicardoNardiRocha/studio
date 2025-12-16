'use client';

import { CorporateProcessesClient } from '@/components/processos/corporate-processes-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CorporateProcessesPage() {
  return (
    <>
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
         <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <CorporateProcessesClient />
        </Suspense>
      </main>
    </>
  );
}
