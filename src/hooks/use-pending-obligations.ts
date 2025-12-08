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
      let pendingCount = 0;
      try {
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));
        
        for (const companyDoc of companiesSnapshot.docs) {
          const obligationsQuery = query(
            collection(firestore, `companies/${companyDoc.id}/taxObligations`),
            where('status', 'in', ['Pendente', 'Atrasada'])
          );
          const obligationsSnapshot = await getDocs(obligationsQuery);
          pendingCount += obligationsSnapshot.size;
        }

        setCount(pendingCount);
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
