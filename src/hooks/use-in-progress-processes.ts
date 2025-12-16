'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function useInProgressProcesses() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchInProgressProcesses = async () => {
      if (!firestore) return;

      setIsLoading(true);
      try {
        let totalCount = 0;
        const companiesSnapshot = await getDocs(collection(firestore, 'companies'));
        
        const processPromises = companiesSnapshot.docs.map(async (companyDoc) => {
          const processesQuery = query(
            collection(firestore, 'companies', companyDoc.id, 'corporateProcesses'),
            where('status', 'in', ['Aguardando Documentação', 'Em Análise', 'Em Preenchimento', 'Protocolado', 'Em Andamento Externo', 'Aguardando Cliente', 'Aguardando Órgão', 'Em Andamento'])
          );
          const processesSnapshot = await getDocs(processesQuery);
          return processesSnapshot.size;
        });

        const counts = await Promise.all(processPromises);
        totalCount = counts.reduce((acc, current) => acc + current, 0);

        setCount(totalCount);
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
