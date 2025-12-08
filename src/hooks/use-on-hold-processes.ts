'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function useOnHoldProcesses() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchOnHoldProcesses = async () => {
      if (!firestore) return;

      setIsLoading(true);
      let onHoldCount = 0;
      try {
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));
        
        for (const companyDoc of companiesSnapshot.docs) {
          const processesQuery = query(
            collection(firestore, `companies/${companyDoc.id}/corporateProcesses`),
            where('status', '==', 'Em Exigência')
          );
          const processesSnapshot = await getDocs(processesQuery);
          onHoldCount += processesSnapshot.size;
        }

        setCount(onHoldCount);
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
