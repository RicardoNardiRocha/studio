
import { CompaniesClient } from '@/components/empresas/companies-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompaniesPage() {
  return (
    <>
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-6">
        <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
          <CompaniesClient />
        </Suspense>
      </main>
    </>
  );
}
