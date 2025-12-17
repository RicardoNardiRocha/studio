'use client';

import { DocumentsClient } from '@/components/documentos/documents-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsPage() {
  return (
    <main className="flex flex-col flex-1 p-4 sm:px-6 sm:py-6 space-y-4">
        <Suspense fallback={<Skeleton className="h-[calc(100vh-8rem)] w-full" />}>
          <DocumentsClient />
        </Suspense>
    </main>
  );
}
