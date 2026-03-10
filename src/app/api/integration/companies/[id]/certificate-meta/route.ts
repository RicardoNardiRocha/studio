import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { differenceInDays, isValid, startOfDay, parse } from 'date-fns';

type ValidityStatus = 'Válido' | 'Vencendo' | 'Vencido' | 'Não informado';

function getCertificateStatus(validity?: string): { status: ValidityStatus; expiresAt: string | null } {
  if (!validity) {
    return { status: 'Não informado', expiresAt: null };
  }
  try {
    const validityDate = parse(validity, 'yyyy-MM-dd', new Date());
    if (!isValid(validityDate)) {
      return { status: 'Não informado', expiresAt: 'Data inválida' };
    }

    const today = startOfDay(new Date());
    const daysLeft = differenceInDays(validityDate, today);
    const dateText = validityDate.toLocaleDateString('pt-BR');

    if (daysLeft < 0) return { status: 'Vencido', expiresAt: dateText };
    if (daysLeft <= 60) return { status: 'Vencendo', expiresAt: dateText };
    return { status: 'Válido', expiresAt: dateText };
  } catch (e) {
    return { status: 'Não informado', expiresAt: 'Erro ao processar data' };
  }
}


export async function GET(request: Request, { params }: { params: { id: string } }) {
  const companyId = params.id;
  if (!companyId) {
    return NextResponse.json({ message: 'Company ID is required.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const certRef = db.doc(`companies/${companyId}/certificates/A1`);
    const certSnap = await certRef.get();

    if (!certSnap.exists) {
      return NextResponse.json({
        companyId,
        type: 'A1',
        url: null,
        storagePath: null,
        validity: null,
        certificateStatus: 'Não informado',
        hasPassword: false,
        updatedAt: null,
      });
    }

    const data = certSnap.data()!;
    const { status, expiresAt } = getCertificateStatus(data.validity);
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null;

    const metadata = {
      companyId,
      type: data.type || 'A1',
      url: data.url || null,
      storagePath: data.storagePath || null,
      validity: data.validity || null,
      certificateStatus: status,
      certificateExpiresAt: expiresAt,
      hasPassword: data.hasPassword === true,
      updatedAt,
    };

    return NextResponse.json(metadata);
  } catch (error: any) {
    console.error(`[API ERROR] /certificate-meta for ${companyId}:`, error.message);
    return NextResponse.json(
      { message: 'Error fetching certificate metadata.', error: error.message },
      { status: 500 }
    );
  }
}
