'use client';

import { AppHeader } from '@/components/layout/header';
import { ObligationsClient } from '@/components/obrigacoes/obligations-client';

export default function ObligationsPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo de Obrigações" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <ObligationsClient />
      </main>
    </>
  );
}
