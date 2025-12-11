'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export function initializeFirebase() {
  // Se já inicializou, só retorna
  if (typeof window !== 'undefined' && getApps().length > 0) {
    return getSdks(getApp());
  }

  // Inicializa corretamente no client
  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
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
export * from './firestore/use-doc';
export * from './firestore/use-collection';
export * from './use-memo-firebase';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './error-emitter';
export * from './errors';
