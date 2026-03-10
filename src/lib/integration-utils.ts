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
    // Denormalized data on the company doc takes precedence
    if (companyData.certificateA1Validity) {
        const statusInfo = getCertificateStatusInfo(companyData.certificateA1Validity);
        return {
            certificateRef: companyData.certificateA1Url || `companies/${companyId}/certificates/A1`,
            certificateStatus: statusInfo.status,
            certificateExpiresAt: statusInfo.dateText,
        };
    }

    // Fallback to subcollection
    const certRef = db.doc(`companies/${companyId}/certificates/A1`);
    const certSnap = await certRef.get();

    if (certSnap.exists) {
        const certData = certSnap.data();
        if (certData && certData.validity) {
            const statusInfo = getCertificateStatusInfo(certData.validity);
            return {
                certificateRef: certRef.path,
                certificateStatus: statusInfo.status,
                certificateExpiresAt: statusInfo.dateText,
            };
        }
    }
    
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
    snapshot = docSnap.exists ? { docs: [docSnap], empty: false } : { docs: [], empty: true };
  } else {
    snapshot = await companiesRef.get();
  }

  if (snapshot.empty) {
    return [];
  }

  const companiesData = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const docId = doc.id;

    const uf = data.sintegra?.data?.uf || 
               data.sintegra?.uf || 
               data.sintegra?.data?.endereco?.uf || 
               getUfFromAddress(data.address) || 
               "";
    
    const status = data.status || 
                   data.sintegraSituacao || 
                   data.sintegra?.data?.situacaoCadastral || 
                   null;
                   
    const updatedAtTimestamp = data.updatedAt || data.sintegraUpdatedAt;
    const updatedAt = updatedAtTimestamp instanceof Timestamp 
      ? updatedAtTimestamp.toDate().toISOString() 
      : null;

    const certificateInfo = await getCertificateData(db, data, docId);

    return {
      id: data.id || docId,
      cnpj: data.cnpj || null,
      razaoSocial: data.name || null,
      nomeFantasia: data.fantasyName || null,
      uf,
      status,
      tenantId: data.tenantId || null,
      certificateRef: certificateInfo.certificateRef,
      certificateStatus: certificateInfo.certificateStatus,
      certificateExpiresAt: certificateInfo.certificateExpiresAt,
      updatedAt,
    };
  }));

  return companiesData;
}
