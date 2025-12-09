'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function useFinancialsSummary() {
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchFinancials = async () => {
      if (!firestore) return;

      setIsLoading(true);
      try {
        const today = new Date();
        const currentMonthPeriod = format(today, 'yyyy-MM');

        const invoicesQuery = query(
          collection(firestore, 'invoices'),
          where('referencePeriod', '==', currentMonthPeriod)
        );
        
        const querySnapshot = await getDocs(invoicesQuery);
        let totalReceived = 0;
        let totalPending = 0;

        querySnapshot.forEach((doc) => {
          const invoice = doc.data();
          if (invoice.status === 'Paga') {
            totalReceived += invoice.amount;
          } else if (invoice.status === 'Pendente' || invoice.status === 'Atrasada') {
            totalPending += invoice.amount;
          }
        });

        setReceivedAmount(totalReceived);
        setPendingAmount(totalPending);

      } catch (error) {
        console.error('Error fetching financial summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancials();
  }, [firestore]);

  return { receivedAmount, pendingAmount, isLoading };
}
