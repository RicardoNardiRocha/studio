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
import { Firestore, doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export interface ModulePermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  permissions: {
    empresas: ModulePermissions;
    societario: ModulePermissions;
    processos: ModulePermissions;
    obrigacoes: ModulePermissions;
    fiscal: ModulePermissions;
    documentos: ModulePermissions;
    financeiro: ModulePermissions;
    usuarios: ModulePermissions;
  };
  companyIds: string[];
  photoURL?: string;
  createdAt: any; 
  updatedAt: any; 
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

const defaultPermissions: UserProfile['permissions'] = {
  empresas: { read: true, create: false, update: false, delete: false },
  societario: { read: true, create: false, update: false, delete: false },
  processos: { read: true, create: false, update: false, delete: false },
  obrigacoes: { read: true, create: false, update: false, delete: false },
  fiscal: { read: false, create: false, update: false, delete: false },
  documentos: { read: true, create: false, update: false, delete: false },
  financeiro: { read: false, create: false, update: false, delete: false },
  usuarios: { read: false, create: false, update: false, delete: false },
};

const ownerPermissions: UserProfile['permissions'] = {
  empresas: { read: true, create: true, update: true, delete: true },
  societario: { read: true, create: true, update: true, delete: true },
  processos: { read: true, create: true, update: true, delete: true },
  obrigacoes: { read: true, create: true, update: true, delete: true },
  fiscal: { read: true, create: true, update: true, delete: true },
  documentos: { read: true, create: true, update: true, delete: true },
  financeiro: { read: true, create: true, update: true, delete: true },
  usuarios: { read: true, create: true, update: true, delete: true },
};


const provisionUserProfile = async (firestore: Firestore, user: User): Promise<UserProfile> => {
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().permissions) {
        return userDoc.data() as UserProfile;
    }
    
    // Check for a specific hardcoded Owner UID.
    const isOwner = user.uid === 'wK9BRBsngobSOBFZEYacPLYAHXl2';
    
    const newUserProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Novo Usuário',
        email: user.email || '',
        permissions: isOwner ? ownerPermissions : defaultPermissions,
        companyIds: [],
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newUserProfile, { merge: true });
    
    return newUserProfile;
};


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
    
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // When auth state changes, cancel any previous profile subscription
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (firebaseUser) {
          setAuthState(current => ({ ...current, user: firebaseUser, isUserLoading: true, userError: null }));
          
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          
          // Subscribe to real-time updates for the user's profile
          unsubscribeProfile = onSnapshot(userDocRef, 
            async (docSnap) => {
              if (docSnap.exists() && docSnap.data().permissions) {
                // Profile exists and is valid, update the state
                setAuthState(current => ({
                  ...current,
                  profile: docSnap.data() as UserProfile,
                  isUserLoading: false,
                  userError: null,
                }));
              } else {
                // Profile doesn't exist or is incomplete, provision it
                 try {
                  const profile = await provisionUserProfile(firestore, firebaseUser);
                   setAuthState(current => ({
                    ...current,
                    profile: profile,
                    isUserLoading: false,
                    userError: null,
                  }));
                } catch (error: any) {
                   setAuthState(current => ({ ...current, userError: error, isUserLoading: false, profile: null }));
                }
              }
            }, 
            (error) => {
              // Handle errors during snapshot listening
              console.error("Error listening to user profile:", error);
              setAuthState(current => ({ ...current, userError: error, isUserLoading: false, profile: null }));
            }
          );

        } else {
          // No user is logged in
          setAuthState({ user: null, profile: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        // Handle initial auth state error
        console.error("Auth state error:", error);
        setAuthState({
          user: null,
          profile: null,
          isUserLoading: false,
          userError: error,
        });
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
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
