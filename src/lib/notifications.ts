
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import {
  collection,
  query,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import {
  isBefore,
  startOfDay,
  addDays,
  differenceInDays,
  isValid,
  isPast,
} from 'date-fns';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: Date;
  link: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type NotificationType =
  | 'certificate_expiring'
  | 'certificate_expired'
  | 'obligation_due'
  | 'obligation_overdue'
  | 'process_status_change'
  | 'process_delayed'
  | 'process_high_priority'
  | 'new_document_added';

export async function getNotifications(): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const today = startOfDay(new Date());

  const createSafeDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString + 'T00:00:00-03:00');
    return isValid(date) ? date : null;
  };

  try {
    const companiesSnapshot = await getDocs(collection(firestore, 'companies'));

    // --- 1. Certificate Notifications ---
    companiesSnapshot.forEach((doc) => {
      const company = doc.data();
      if (company.certificateA1Validity) {
        const validityDate = createSafeDate(company.certificateA1Validity);
        if (validityDate) {
          const daysLeft = differenceInDays(validityDate, today);
          if (daysLeft < 0) {
            notifications.push({ id: `cert-expired-${doc.id}`, type: 'certificate_expired', title: 'Certificado Vencido', message: `O certificado A1 da empresa ${company.name} venceu.`, date: validityDate, link: '/empresas', severity: 'critical' });
          } else if (daysLeft <= 60) {
            notifications.push({ id: `cert-expiring-${doc.id}`, type: 'certificate_expiring', title: 'Certificado a Vencer', message: `O certificado A1 da empresa ${company.name} vencerá em ${daysLeft + 1} dias.`, date: validityDate, link: '/empresas', severity: daysLeft <= 30 ? 'high' : 'medium' });
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
                    notifications.push({ id: `ecpf-expired-${doc.id}`, type: 'certificate_expired', title: 'e-CPF Vencido', message: `O e-CPF do sócio ${partner.name} venceu.`, date: validityDate, link: '/societario', severity: 'critical' });
                } else if (daysLeft <= 60) {
                    notifications.push({ id: `ecpf-expiring-${doc.id}`, type: 'certificate_expiring', title: 'e-CPF a Vencer', message: `O e-CPF do sócio ${partner.name} vencerá em ${daysLeft + 1} dias.`, date: validityDate, link: '/societario', severity: daysLeft <= 30 ? 'high' : 'medium' });
                }
            }
        }
    });

    // --- 2. Obligations & Processes Notifications ---
    const next15Days = addDays(today, 15);
    const processesSnapshot = await getDocs(collection(firestore, 'corporateProcesses'));
    
    // Obligations need to be fetched per company
    const obligationPromises = companiesSnapshot.docs.map(companyDoc => 
      getDocs(collection(firestore, 'companies', companyDoc.id, 'taxObligations'))
    );
    const allObligationsResults = await Promise.allSettled(obligationPromises);

    allObligationsResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        result.value.forEach(doc => {
          const ob = doc.data();
          const dueDate = (ob.dataVencimento as Timestamp)?.toDate();
          if (dueDate && (ob.status === 'Pendente' || ob.status === 'Atrasada')) {
            const isOverdue = ob.status === 'Atrasada' || (ob.status === 'Pendente' && isPast(dueDate));
            if (isOverdue) {
              notifications.push({ id: `ob-overdue-${doc.id}`, type: 'obligation_overdue', title: 'Obrigação Atrasada', message: `${ob.nome} da empresa ${ob.companyName}.`, date: dueDate, link: '/obrigacoes', severity: 'high' });
            } else if (isBefore(dueDate, next15Days)) {
              notifications.push({ id: `ob-due-${doc.id}`, type: 'obligation_due', title: 'Obrigação a Vencer', message: `${ob.nome} da empresa ${ob.companyName}.`, date: dueDate, link: '/obrigacoes', severity: 'medium' });
            }
          }
        });
      }
    });

    processesSnapshot.forEach(doc => {
        const proc = doc.data();
        const startDate = (proc.startDate as Timestamp)?.toDate();
        const isProcessActive = proc.status !== 'Concluído' && proc.status !== 'Cancelado';

        // High Priority Process
        if (proc.priority === 'Alta' && isProcessActive) {
             notifications.push({ id: `proc-priority-${doc.id}`, type: 'process_high_priority', title: 'Processo com Prioridade Alta', message: `${proc.processType} para ${proc.companyName}.`, date: startDate || new Date(), link: '/processos', severity: 'high' });
        }
        
        // Process in "Em Exigência"
        if (proc.status === 'Em Exigência') {
            notifications.push({ id: `proc-status-${doc.id}`, type: 'process_status_change', title: 'Processo em Exigência', message: `${proc.processType} para ${proc.companyName}.`, date: startDate || new Date(), link: '/processos', severity: 'critical' });
        }

        // Delayed Process
        if (startDate && isProcessActive && differenceInDays(today, startDate) > 30) {
            notifications.push({ id: `proc-delayed-${doc.id}`, type: 'process_delayed', title: 'Processo Atrasado', message: `O processo de ${proc.processType} para ${proc.companyName} está aberto há mais de 30 dias.`, date: startDate, link: '/processos', severity: 'medium' });
        }
    });


  } catch (error) {
    console.error('A critical error occurred while fetching notifications:', error);
  }

  // Remove duplicates and sort
  const uniqueNotifications = Array.from(new Map(notifications.map(n => [n.id, n])).values());
  return uniqueNotifications.sort((a, b) => b.date.getTime() - a.date.getTime());
}
