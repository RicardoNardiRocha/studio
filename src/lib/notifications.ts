
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  collectionGroup,
} from 'firebase/firestore';
import {
  isBefore,
  startOfDay,
  addDays,
  differenceInDays,
  isValid,
} from 'date-fns';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);

// Define the shape of a notification object
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: Date;
  link: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Define the possible types of notifications
export type NotificationType =
  | 'certificate_expiring'
  | 'certificate_expired'
  | 'obligation_due'
  | 'obligation_overdue'
  | 'process_status_change'
  | 'new_document_added';

// Function to fetch all notifications
export async function getNotifications(): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const today = startOfDay(new Date());

  // Helper function to safely create a Date object
  const createSafeDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00-03:00');
    return isValid(date) ? date : null;
  };
  
  const companiesSnapshot = await getDocs(collection(firestore, 'companies'));
  const companies = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));


  // 1. Certificate Notifications
  try {
    companies.forEach((company) => {
      if (company.certificateA1Validity) {
        const validityDate = createSafeDate(company.certificateA1Validity as string);
        if (validityDate) {
          const daysLeft = differenceInDays(validityDate, today);
          if (daysLeft < 0) {
            notifications.push({
              id: `cert-expired-${company.id}`,
              type: 'certificate_expired',
              title: 'Certificado Vencido',
              message: `O certificado A1 da empresa ${company.name} venceu.`,
              date: validityDate,
              link: '/empresas',
              severity: 'critical',
            });
          } else if (daysLeft <= 60) {
            notifications.push({
              id: `cert-expiring-${company.id}`,
              type: 'certificate_expiring',
              title: 'Certificado a Vencer',
              message: `O certificado A1 da empresa ${company.name} está prestes a vencer.`,
              date: validityDate,
              link: '/empresas',
              severity: daysLeft <= 30 ? 'high' : 'medium',
            });
          }
        }
      }
    });

    const partnersSnapshot = await getDocs(collection(firestore, 'partners'));
    partnersSnapshot.forEach((doc) => {
      const partner = doc.data();
      if (partner.ecpfValidity) {
        const validityDate = createSafeDate(partner.ecpfValidity);
        if (validityDate) {
          const daysLeft = differenceInDays(validityDate, today);
          if (daysLeft < 0) {
            notifications.push({
              id: `ecpf-expired-${doc.id}`,
              type: 'certificate_expired',
              title: 'e-CPF Vencido',
              message: `O e-CPF do sócio ${partner.name} venceu.`,
              date: validityDate,
              link: '/societario',
              severity: 'critical',
            });
          } else if (daysLeft <= 60) {
            notifications.push({
              id: `ecpf-expiring-${doc.id}`,
              type: 'certificate_expiring',
              title: 'e-CPF a Vencer',
              message: `O e-CPF do sócio ${partner.name} está prestes a vencer.`,
              date: validityDate,
              link: '/societario',
              severity: daysLeft <= 30 ? 'high' : 'medium',
            });
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching certificate notifications:', error);
  }

  // 2. Obligation and Process Notifications (Iterating through companies)
  try {
    const next15Days = addDays(today, 15);
    for (const company of companies) {
      // Obligations
      const obligationsRef = collection(firestore, `companies/${company.id}/taxObligations`);
      const obligationsQuery = query(obligationsRef, where('status', 'in', ['Pendente', 'Atrasada']));
      const obligationsSnapshot = await getDocs(obligationsQuery);

      obligationsSnapshot.forEach((doc) => {
        const ob = doc.data();
        const dueDate = (ob.dataVencimento as Timestamp)?.toDate();
        if (dueDate) {
          if (ob.status === 'Atrasada' || (ob.status === 'Pendente' && isBefore(dueDate, today))) {
            notifications.push({
              id: `ob-overdue-${doc.id}`,
              type: 'obligation_overdue',
              title: 'Obrigação Atrasada',
              message: `${ob.nome} da empresa ${ob.companyName}.`,
              date: dueDate,
              link: '/obrigacoes',
              severity: 'high',
            });
          } else if (ob.status === 'Pendente' && isBefore(dueDate, next15Days)) {
            notifications.push({
              id: `ob-due-${doc.id}`,
              type: 'obligation_due',
              title: 'Obrigação a Vencer',
              message: `${ob.nome} da empresa ${ob.companyName}.`,
              date: dueDate,
              link: '/obrigacoes',
              severity: 'medium',
            });
          }
        }
      });

      // Processes
      const processesRef = collection(firestore, `companies/${company.id}/corporateProcesses`);
      const processesQuery = query(processesRef, where('status', '==', 'Em Exigência'));
      const processesSnapshot = await getDocs(processesQuery);

      processesSnapshot.forEach((doc) => {
        const proc = doc.data();
        const startDate = (proc.startDate as Timestamp)?.toDate();
        notifications.push({
          id: `proc-status-${doc.id}`,
          type: 'process_status_change',
          title: 'Processo em Exigência',
          message: `${proc.processType} da empresa ${proc.companyName}.`,
          date: startDate || new Date(),
          link: '/processos',
          severity: 'high',
        });
      });
    }
  } catch (error) {
    console.error('Error fetching obligation/process notifications:', error);
  }


  // Return notifications sorted by date
  return notifications.sort((a, b) => b.date.getTime() - a.date.getTime());
}
