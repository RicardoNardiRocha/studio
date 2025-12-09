'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export function usePendingObligations() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchPendingObligations = async () => {
      if (!firestore) return;

      setIsLoading(true);
      try {
        const obligationsQuery = query(
          collection(firestore, 'taxObligations'),
          where('status', 'in', ['Pendente', 'Atrasada'])
        );
        const snapshot = await getCountFromServer(obligationsQuery);
        setCount(snapshot.data().count);
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
