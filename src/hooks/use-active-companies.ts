'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export function useActiveCompanies() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchActiveCompanies = async () => {
      if (!firestore) return;

      setIsLoading(true);
      try {
        const companiesQuery = query(
          collection(firestore, 'companies'),
          where('status', '==', 'ATIVA')
        );
        const snapshot = await getCountFromServer(companiesQuery);
        setCount(snapshot.data().count);
      } catch (error) {
        console.error('Error fetching active companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveCompanies();
  }, [firestore]);

  return { count, isLoading };
}
