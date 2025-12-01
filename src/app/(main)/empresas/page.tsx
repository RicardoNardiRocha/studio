

import { AppHeader } from '@/components/layout/header';
import { CompaniesClient } from '@/components/empresas/companies-client';

export default function CompaniesPage() {
  return (
    <>
      <AppHeader pageTitle="Módulo Empresas" />
      <main className="flex-1 space-y-4 p-4 sm:px-6 sm:py-0">
        <CompaniesClient />
      </main>
    </>
  );
}
