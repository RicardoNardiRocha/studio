'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export function useInProgressProcesses() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchInProgressProcesses = async () => {
      if (!firestore) return;

      setIsLoading(true);
      try {
        const processesQuery = query(
          collection(firestore, 'corporateProcesses'),
          where('status', 'in', ['Aguardando Documentação', 'Em Análise', 'Em Exigência'])
        );
        const snapshot = await getCountFromServer(processesQuery);
        setCount(snapshot.data().count);
      } catch (error) {
        console.error('Error fetching in-progress processes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInProgressProcesses();
  }, [firestore]);

  return { count, isLoading };
}
