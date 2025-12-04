'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // On the server, we don't initialize
  if (typeof window === 'undefined') {
    // This is a placeholder for server-side rendering,
    // it should not be used to access Firebase services.
    // A proper implementation would use the Admin SDK on the server.
    if (getApps().length === 0) {
        initializeApp(firebaseConfig);
    }
    const app = getApp();
    return getSdks(app);
  }
  
  // If already initialized on the client, return SDKs
  if (getApps().length) {
    return getSdks(getApp());
  }

  // On client, ALWAYS use firebaseConfig
  const firebaseApp = initializeApp(firebaseConfig);

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
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