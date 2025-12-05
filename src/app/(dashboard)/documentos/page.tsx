'use client';

import { AppHeader } from '@/components/layout/header';
import { DocumentsClient } from '@/components/documentos/documents-client';

export default function DocumentsPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo de Documentos" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <DocumentsClient />
      </main>
    </>
  );
}
