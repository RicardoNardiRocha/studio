'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function usePendingObligations() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchPendingObligations = async () => {
      if (!firestore) return;

      setIsLoading(true);
      try {
        let totalCount = 0;
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));

        const obligationPromises = companiesSnapshot.docs.map(async (companyDoc) => {
          const obligationsQuery = query(
            collection(firestore, 'companies', companyDoc.id, 'taxObligations'),
            where('status', 'in', ['Pendente', 'Atrasada'])
          );
          const obligationsSnapshot = await getDocs(obligationsQuery);
          return obligationsSnapshot.size;
        });

        const counts = await Promise.all(obligationPromises);
        totalCount = counts.reduce((acc, current) => acc + current, 0);
        
        setCount(totalCount);
      } catch (error) {
        console.error('Error fetching pending obligations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingObligations();
  }, [firestore]);

  return { count, isLoading };
}
