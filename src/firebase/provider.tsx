'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  roleId: string;
  photoURL?: string;
}

interface UserAuthState {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [authState, setAuthState] = useState<UserAuthState>({
    user: null,
    profile: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setAuthState({
        user: null,
        profile: null,
        isUserLoading: false,
        userError: new Error('Auth or Firestore service not available'),
      });
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in, now fetch their profile from Firestore.
          const profileDocRef = doc(firestore, 'users', firebaseUser.uid);
          const unsubscribeProfile = onSnapshot(profileDocRef, 
            (docSnap) => {
              if (docSnap.exists()) {
                setAuthState({
                  user: firebaseUser,
                  profile: docSnap.data() as UserProfile,
                  isUserLoading: false,
                  userError: null,
                });
              } else {
                // Profile doesn't exist, which might be a temporary state during signup.
                setAuthState({
                  user: firebaseUser,
                  profile: null, // No profile yet
                  isUserLoading: false,
                  userError: null, // Not necessarily an error yet
                });
              }
            },
            (error) => {
               // Error fetching profile
               setAuthState({
                  user: firebaseUser,
                  profile: null,
                  isUserLoading: false,
                  userError: error,
                });
            }
          );
          // Return a cleanup function that unsubscribes from the profile listener.
          return () => unsubscribeProfile();
        } else {
          // User is signed out.
          setAuthState({ user: null, profile: null, isUserLoading: false, userError: null });
        }
      },
      (error) =>
        setAuthState({
          user: null,
          profile: null,
          isUserLoading: false,
          userError: error,
        })
    );

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  const value = useMemo(() => {
    const available =
      firebaseApp !== null && firestore !== null && auth !== null && storage !== null;

    return {
      areServicesAvailable: available,
      firebaseApp,
      firestore,
      auth,
      storage,
      user: authState.user,
      profile: authState.profile,
      isUserLoading: authState.isUserLoading,
      userError: authState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, authState]);

  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error('useFirebase must be inside FirebaseProvider');
  if (!ctx.areServicesAvailable) throw new Error('Firebase core services not available');
  return ctx;
}

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore!;
export const useStorage = () => useFirebase().storage!;
export const useUser = () => {
  const { user, profile, isUserLoading, userError } = useFirebase();
  return { user, profile, isUserLoading, userError };
};

// useMemoFirebase hook to help with memoization of queries/refs
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  const memoized = useMemo(factory, deps);
  
  if (typeof memoized === 'object' && memoized !== null) {
    (memoized as any).__memo = true;
  }
  
  return memoized;
}
