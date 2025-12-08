'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

export function useExpiringCertificates() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    const fetchExpiringCertificates = async () => {
      if (!firestore) return;

      setIsLoading(true);
      let expiringCount = 0;
      const today = startOfDay(new Date());
      const limitDate = new Date(today);
      limitDate.setDate(today.getDate() + 30);

      try {
        // Check company certificates (A1)
        const companiesQuery = query(collection(firestore, 'companies'));
        const companiesSnapshot = await getDocs(companiesQuery);
        companiesSnapshot.forEach((doc) => {
          const company = doc.data();
          if (company.certificateA1Validity) {
            try {
              const validityDate = parseISO(company.certificateA1Validity);
              const daysLeft = differenceInDays(validityDate, today);
              if (daysLeft >= 0 && daysLeft <= 30) {
                expiringCount++;
              }
            } catch(e) {
                console.warn(`Invalid date format for company ${company.id}: ${company.certificateA1Validity}`);
            }
          }
        });

        // Check partner certificates (e-CPF)
        const partnersQuery = query(collection(firestore, 'partners'));
        const partnersSnapshot = await getDocs(partnersQuery);
        partnersSnapshot.forEach((doc) => {
          const partner = doc.data();
          if (partner.ecpfValidity) {
             try {
                const validityDate = parseISO(partner.ecpfValidity);
                const daysLeft = differenceInDays(validityDate, today);
                if (daysLeft >= 0 && daysLeft <= 30) {
                    expiringCount++;
                }
             } catch (e) {
                console.warn(`Invalid date format for partner ${partner.id}: ${partner.ecpfValidity}`);
             }
          }
        });

        setCount(expiringCount);
      } catch (error) {
        console.error('Error fetching expiring certificates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpiringCertificates();
  }, [firestore]);

  return { count, isLoading };
}
