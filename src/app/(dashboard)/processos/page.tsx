'use client';

import { AppHeader } from '@/components/layout/header';
import { CorporateProcessesClient } from '@/components/processos/corporate-processes-client';

export default function CorporateProcessesPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo de Processos" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <CorporateProcessesClient />
      </main>
    </>
  );
}
