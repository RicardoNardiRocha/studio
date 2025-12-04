'use client';

import React, { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children, firebaseApp, firestore, auth }) => {
  const [userState, setUserState] = useState<{
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: null,
    isUserLoading: true,
    userError: null
  });

  useEffect(() => {
    if (!auth) {
      setUserState({
        user: null,
        isUserLoading: false,
        userError: new Error("Auth not available")
      });
      return;
    }

    const unsub = onAuthStateChanged(
      auth,
      (u) => setUserState({ user: u, isUserLoading: false, userError: null }),
      (err) => setUserState({ user: null, isUserLoading: false, userError: err })
    );

    return () => unsub();
  }, [auth]);

  const value = useMemo(() => {
    const available = firebaseApp !== null && firestore !== null && auth !== null;
    return {
      areServicesAvailable: available,
      firebaseApp,
      firestore,
      auth,
      user: userState.user,
      isUserLoading: userState.isUserLoading,
      userError: userState.userError
    }
  }, [firebaseApp, firestore, auth, userState]);

  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error("useFirebase must be inside a FirebaseProvider");
  if (!ctx.areServicesAvailable) throw new Error('Firebase core services not available');
  return ctx;
};

export const useAuth = () => useFirebase().auth!;
export const useFirestore = () => useFirebase().firestore!;
export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

// useMemoFirebase hook to help with memoization of queries/refs
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  const memoized = useMemo(factory, deps);
  
  if (typeof memoized === 'object' && memoized !== null) {
    (memoized as any).__memo = true;
  }
  
  return memoized;
}
