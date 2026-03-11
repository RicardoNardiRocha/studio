'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { serverTimestamp } from 'firebase-admin/firestore';
import * as forge from 'node-forge';
import { encrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

// This is a placeholder. In a real app, you'd get the user from a session.
async function getAuthenticatedUser() {
    return {
        uid: 'server-admin-placeholder',
        displayName: 'Sistema (Server Action)'
    };
}


export async function saveCertificateAction(formData: FormData) {
  const companyId = formData.get('companyId') as string;
  const password = formData.get('password') as string;
  const file = formData.get('file') as File;

  if (!companyId || !password || !file) {
    return { success: false, message: 'Dados incompletos.' };
  }
  
  const db = getAdminDb();
  const bucket = getStorage().bucket(`gs://${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`);

  try {
    const user = await getAuthenticatedUser();

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // 1. Parse o certificado para extrair a data de validade
    const p12Asn1 = forge.asn1.fromDer(fileBuffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag]?.[0];
    if (!certBag || !certBag.cert) {
        throw new Error('Certificado inválido ou senha incorreta.');
    }
    const certificate = certBag.cert;
    const validityDate = certificate.validity.notAfter;
    const validityDateString = validityDate.toISOString().split('T')[0];

    // 2. Criptografe a senha
    const encryptedPasswordPayload = encrypt(password);

    // 3. Faça o upload do arquivo para o Firebase Storage
    const storagePath = `companies/${companyId}/certificate.pfx`;
    const storageFile = bucket.file(storagePath);
    await storageFile.save(fileBuffer, { contentType: 'application/x-pkcs12' });
    const [url] = await storageFile.getSignedUrl({ action: 'read', expires: '03-09-2491' });

    // 4. Salve os metadados e a senha criptografada no Firestore
    const batch = db.batch();
    
    const certificateDocRef = db.doc(`companies/${companyId}/certificates/A1`);
    const certificateData = {
        type: 'A1',
        storagePath,
        url,
        validity: validityDateString,
        hasPassword: true,
        passwordEncrypted: encryptedPasswordPayload.encryptedData,
        passwordIv: encryptedPasswordPayload.iv,
        passwordTag: encryptedPasswordPayload.authTag,
        encryptionVersion: 'v1',
        uploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        uploadedBy: user.displayName,
    };
    batch.set(certificateDocRef, certificateData, { merge: true });

    // 5. Denormalize dados importantes para o documento principal da empresa
    const companyDocRef = db.doc(`companies/${companyId}`);
    batch.update(companyDocRef, {
        certificateA1Validity: validityDateString,
        certificateA1Url: url,
    });
    
    await batch.commit();

    revalidatePath(`/empresas`); // Revalidates the company list page
    return { success: true, message: 'Certificado salvo com sucesso!' };

  } catch (error: any) {
    console.error('Error saving certificate:', error);
    return { success: false, message: error.message || 'Falha ao salvar o certificado.' };
  }
}
