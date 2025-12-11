'use client';

import React, {
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

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  roleId: 'owner' | 'admin' | 'contador' | 'usuario';
  companyIds: string[];
  isAdmin: boolean;
  canFinance: boolean;
  photoURL?: string;
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
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

export const FirebaseProvider: React.FC<{
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}> = ({
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
                setAuthState({
                  user: firebaseUser,
                  profile: null, 
                  isUserLoading: false,
                  userError: new Error("Perfil do usuário não encontrado no banco de dados."),
                });
              }
            },
            (error) => {
               setAuthState({
                  user: firebaseUser,
                  profile: null,
                  isUserLoading: false,
                  userError: error,
                });
            }
          );
          return () => unsubscribeProfile();
        } else {
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
