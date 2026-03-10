
import 'server-only';
import { getAdminDb } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { differenceInDays, isValid, startOfDay } from 'date-fns';
import { getUfFromAddress } from '@/lib/utils';

type ValidityStatus = 'Válido' | 'Vencendo' | 'Vencido' | 'Não informado';

const getCertificateStatusInfo = (validity?: string): { text: string; status: ValidityStatus; daysLeft?: number; dateText: string } => {
  if (!validity) {
    return { text: 'Não informado', status: 'Não informado', dateText: 'N/A' };
  }
  try {
    const [year, month, day] = validity.split('-').map(Number);
    const validityDate = startOfDay(new Date(year, month - 1, day));
    if (!isValid(validityDate)) {
      return { text: 'Data inválida', status: 'Não informado', dateText: 'Inválida' };
    }

    const today = startOfDay(new Date());
    const daysLeft = differenceInDays(validityDate, today);
    const dateText = validityDate.toLocaleDateString('pt-BR');

    if (daysLeft < 0) {
      return { text: 'Vencido', status: 'Vencido', daysLeft, dateText };
    }
    if (daysLeft <= 60) {
      return { text: `Vence em ${daysLeft}d`, status: 'Vencendo', daysLeft, dateText };
    }
    return { text: 'Válido', status: 'Válido', daysLeft, dateText };
  } catch (e) {
    return { text: 'Data inválida', status: 'Não informado', dateText: 'Inválida' };
  }
};


async function getCertificateData(db: FirebaseFirestore.Firestore, companyData: any, companyId: string) {
    // 1. Prioritize denormalized data on the company doc for performance
    if (companyData.certificateA1Validity) {
        const statusInfo = getCertificateStatusInfo(companyData.certificateA1Validity);
        return {
            certificateRef: companyData.certificateA1Url || null, // Use the URL if available
            certificateStatus: statusInfo.status,
            certificateExpiresAt: statusInfo.dateText,
        };
    }

    // 2. Fallback to subcollection if denormalized data is missing
    const certRef = db.doc(`companies/${companyId}/certificates/A1`);
    const certSnap = await certRef.get();

    if (certSnap.exists) {
        const certData = certSnap.data();
        // The actual field in the subcollection is 'validity'
        if (certData && certData.validity) {
            const statusInfo = getCertificateStatusInfo(certData.validity);
            return {
                certificateRef: certData.url || null, // Use the URL from the subcollection document
                certificateStatus: statusInfo.status,
                certificateExpiresAt: statusInfo.dateText,
            };
        }
    }
    
    // 3. Default if nothing found
    return {
        certificateRef: null,
        certificateStatus: 'Não informado',
        certificateExpiresAt: null,
    };
}


/**
 * Busca dados de empresas no Firestore usando o Admin SDK.
 * Se um `companyId` (CNPJ numérico) for fornecido, busca uma única empresa.
 * Caso contrário, busca todas as empresas.
 */
export async function getCompaniesData(companyId?: string) {
  const db = getAdminDb();
  const companiesRef = db.collection('companies');
  
  let snapshot;
  if (companyId) {
    const docRef = companiesRef.doc(companyId);
    const docSnap = await docRef.get();
    snapshot = docSnap.exists ? { docs: [docSnap], empty: false, size: 1 } : { docs: [], empty: true, size: 0 };
  } else {
    snapshot = await companiesRef.get();
  }

  console.log(`[API Integration] Consulting collection path: ${companiesRef.path}`);
  console.log(`[API Integration] Documents found in query snapshot: ${snapshot.size}`);

  if (snapshot.empty) {
    console.log('[API Integration] Snapshot is empty. Returning [].');
    return [];
  }
  
  console.log(`[API Integration] First document ID: ${snapshot.docs[0].id}`);
  console.log(`[API Integration] Raw data for first doc:`, JSON.stringify(snapshot.docs[0].data(), null, 2));


  const companiesData = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const docId = doc.id;

    // Use a fallback chain for updatedAt
    const updatedAtTimestamp = data.updatedAt || data.sintegraUpdatedAt;
    const updatedAt = updatedAtTimestamp instanceof Timestamp 
      ? updatedAtTimestamp.toDate().toISOString() 
      : null;

    const certificateInfo = await getCertificateData(db, data, docId);

    const transformedData = {
      id: data.id || data.cnpj || docId,
      cnpj: data.cnpj || null,
      razaoSocial: data.name || data.razao_social || data.razaoSocial || null,
      nomeFantasia: data.fantasyName || data.nome_fantasia || data.nomeFantasia || "",
      uf: data.sintegra?.data?.endereco?.uf || data.sintegra?.data?.uf || data.sintegra?.uf || getUfFromAddress(data.address) || "",
      status: data.status || data.sintegraSituacao || data.sintegra?.data?.situacaoCadastral || null,
      tenantId: data.tenantId || null,
      certificateRef: certificateInfo.certificateRef,
      certificateStatus: certificateInfo.certificateStatus,
      certificateExpiresAt: certificateInfo.certificateExpiresAt,
      updatedAt,
    };
    
    // Log only the first transformed document for diagnosis
    if (snapshot.docs.indexOf(doc) === 0) {
      console.log(`[API Integration] Transformed data for first doc:`, JSON.stringify(transformedData, null, 2));
    }

    return transformedData;
  }));
  
  console.log(`[API Integration] Total documents transformed: ${companiesData.length}`);
  return companiesData;
}
