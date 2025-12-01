import { CompanyDetailsClient } from '@/components/empresas/company-details-client';

export default function CompanyDetailsPage({ params }: { params: { id: string } }) {
  return <CompanyDetailsClient id={params.id} />;
}
