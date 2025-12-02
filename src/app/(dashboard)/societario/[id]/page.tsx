import { PartnerDetailsClient } from '@/components/societario/partner-details-client';

export default function PartnerDetailsPage({ params }: { params: { id: string } }) {
  return <PartnerDetailsClient id={params.id} />;
}
