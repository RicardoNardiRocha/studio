import 'server-only';
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { differenceInDays, isValid, startOfDay } from 'date-fns';
import { getUfFromAddress } from '@/lib/utils';

type ValidityStatus = 'Válido' | 'Vencendo' | 'Vencido' | 'Não informado';

// --- Configuração do Firebase Admin ---
// Usamos a configuração do cliente, mas garantimos que seja inicializado apenas uma vez no lado do servidor.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const getDb = () => {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
};


// --- Funções de Extração de Dados ---

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


// --- Função Principal de Busca de Dados ---

async function getCertificateData(companyId: string) {
    const db = getDb();
    const certRef = doc(db, `companies/${companyId}/certificates/A1`);
    const certSnap = await getDoc(certRef);

    if (certSnap.exists()) {
        const certData = certSnap.data();
        const statusInfo = getCertificateStatusInfo(certData.validity);
        return {
            certificateRef: certRef.path,
            certificateStatus: statusInfo.status,
            certificateExpiresAt: statusInfo.dateText,
        };
    }
    return {
        certificateRef: null,
        certificateStatus: 'Não informado',
        certificateExpiresAt: null,
    };
}


/**
 * Busca dados de empresas no Firestore.
 * Se um `companyId` (CNPJ) for fornecido, busca uma única empresa.
 * Caso contrário, busca todas as empresas.
 */
export async function getCompaniesData(companyId?: string) {
  const db = getDb();
  const companiesRef = collection(db, 'companies');
  
  let snapshot;
  if (companyId) {
    const q = query(companiesRef, where("cnpj", "==", companyId));
    snapshot = await getDocs(q);
  } else {
    snapshot = await getDocs(companiesRef);
  }

  if (snapshot.empty) {
    return [];
  }

  const companiesData = await Promise.all(snapshot.docs.map(async (companyDoc) => {
    const company = companyDoc.data();
    const certificateInfo = await getCertificateData(company.id);
    
    // Convertendo Timestamps do Firestore para strings ISO
    const updatedAt = company.updatedAt instanceof Timestamp 
      ? company.updatedAt.toDate().toISOString() 
      : (company.updatedAt || null);

    return {
      id: company.id,
      cnpj: company.cnpj,
      razaoSocial: company.name,
      nomeFantasia: company.fantasyName || null,
      uf: getUfFromAddress(company.address),
      status: company.sintegraSituacao || null, // Usando o status do sintegra se disponível
      tenantId: null, // Placeholder, se não houver tenantId real
      certificateRef: certificateInfo.certificateRef,
      certificateStatus: certificateInfo.certificateStatus,
      certificateExpiresAt: certificateInfo.certificateExpiresAt,
      updatedAt,
    };
  }));

  return companiesData;
}
