import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { decrypt, type EncryptedPayload } from '@/lib/crypto';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const companyId = params.id;
  if (!companyId) {
    return NextResponse.json({ message: 'Company ID is required.' }, { status: 400 });
  }

  // Authentication is handled by the middleware
  
  try {
    const db = getAdminDb();
    const certRef = db.doc(`companies/${companyId}/certificates/A1`);
    const certSnap = await certRef.get();

    if (!certSnap.exists) {
      return NextResponse.json({ message: 'Certificate not found for this company.' }, { status: 404 });
    }

    const data = certSnap.data()!;

    if (!data.hasPassword || !data.passwordEncrypted || !data.passwordIv || !data.passwordTag) {
      return NextResponse.json({ message: 'Certificate password is not stored.' }, { status: 404 });
    }

    const encryptedPayload: EncryptedPayload = {
      iv: data.passwordIv,
      encryptedData: data.passwordEncrypted,
      authTag: data.passwordTag,
    };

    const decryptedPassword = decrypt(encryptedPayload);

    const accessData = {
      url: data.url || null,
      storagePath: data.storagePath || null,
      password: decryptedPassword,
    };

    return NextResponse.json(accessData);
  } catch (error: any) {
    console.error(`[API ERROR] /certificate-access for ${companyId}:`, error.message);
    if (error.message.includes('Unsupported state or unable to authenticate')) {
       return NextResponse.json(
        { message: 'Decryption failed. Check if the secret key is correct.', error: 'Authentication tag check failed.' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: 'Error retrieving certificate access data.', error: error.message },
      { status: 500 }
    );
  }
}
