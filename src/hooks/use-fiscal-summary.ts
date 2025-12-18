'use client';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getCountFromServer, Timestamp } from 'firebase/firestore';
import { subMonths, getMonth, getYear } from 'date-fns';

export const useFiscalSummary = () => {
  const [dasSent, setDasSent] = useState(0);
  const [dasPending, setDasPending] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchFiscalSummary = async () => {
      if (!firestore) return;
      setIsLoading(true);

      try {
        const prevMonthDate = subMonths(new Date(), 1);
        const prevMonth = getMonth(prevMonthDate); // 0-indexed
        const prevMonthYear = getYear(prevMonthDate);
        
        const q = query(
          collection(firestore, 'xmlStatus'),
          where('month', '==', prevMonth),
          where('year', '==', prevMonthYear),
        );
        
        const sentQuery = query(q, where('dasStatus', '==', 'DAS Enviado'));
        const sentSnapshot = await getCountFromServer(sentQuery);
        setDasSent(sentSnapshot.data().count);
        
        // Para pendentes, precisamos saber o total de empresas que deveriam ter enviado
        // E subtrair as que enviaram
        const totalCompaniesQuery = query(
            collection(firestore, 'companies'),
            where('receivesXml', '==', true)
        );
        const totalCompaniesSnapshot = await getCountFromServer(totalCompaniesQuery);
        const totalRelevantCompanies = totalCompaniesSnapshot.data().count;

        setDasPending(totalRelevantCompanies - sentSnapshot.data().count);

      } catch (error) {
        console.error("Error fetching fiscal summary:", error);
        setDasSent(0);
        setDasPending(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiscalSummary();
  }, [firestore]);

  return { dasSent, dasPending, isLoading };
};
