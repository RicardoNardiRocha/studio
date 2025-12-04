'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

export function FirebaseClientProvider({ children }: { children: React.ReactNode}) {
  const services = useMemo(() => initializeFirebase(), []);

  if (!services.firebaseApp) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
