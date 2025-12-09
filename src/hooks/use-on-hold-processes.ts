'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs,getCountFromServer } from 'firebase/firestore';

export function useOnHoldProcesses() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchOnHoldProcesses = async () => {
      if (!firestore) return;

      setIsLoading(true);
      try {
        const processesQuery = query(
          collection(firestore, 'corporateProcesses'),
          where('status', '==', 'Em Exigência')
        );
        const snapshot = await getCountFromServer(processesQuery);
        setCount(snapshot.data().count);
      } catch (error) {
        console.error('Error fetching on-hold processes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnHoldProcesses();
  }, [firestore]);

  return { count, isLoading };
}
