
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// CLIENT-SIDE ONLY INITIALIZATION
export function initializeFirebase() {
  // 🚫 Nunca inicializar Firebase no servidor
  if (typeof window === 'undefined') {
    return {
      firebaseApp: null,
      auth: null,
      firestore: null,
      storage: null
    };
  }

  // Se já existe um app, reutiliza
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // Inicialização CORRETA no cliente usando firebaseConfig
  const app = initializeApp(firebaseConfig);
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
