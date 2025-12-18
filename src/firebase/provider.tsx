'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, onSnapshot, setDoc, serverTimestamp, collection, getDocs, limit, query } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export interface ModulePermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

const allPermissions: ModulePermissions = { read: true, create: true, update: true, delete: true };

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  permissions: Record<keyof typeof defaultPermissions, ModulePermissions>;
  companyIds?: string[];
  photoURL?: string;
  isAdmin?: boolean;
  roleId?: string;
  canFinance?: boolean;
}

const defaultPermissions = {
  dashboard: { read: true, create: false, update: false, delete: false },
  empresas: { read: false, create: false, update: false, delete: false },
  societario: { read: false, create: false, update: false, delete: false },
  processos: { read: false, create: false, update: false, delete: false },
  obrigacoes: { read: false, create: false, update: false, delete: false },
  fiscal: { read: false, create: false, update: false, delete: false },
  documentos: { read: false, create: false, update: false, delete: false },
  financeiro: { read: false, create: false, update: false, delete: false },
  usuarios: { read: false, create: false, update: false, delete: false },
};

const adminPermissions = {
  dashboard: allPermissions,
  empresas: allPermissions,
  societario: allPermissions,
  processos: allPermissions,
  obrigacoes: allPermissions,
  fiscal: allPermissions,
  documentos: allPermissions,
  financeiro: allPermissions,
  usuarios: allPermissions,
};


interface FirebaseContextState {
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

export const FirebaseContext =
  createContext<FirebaseContextState | undefined>(undefined);

export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}) {
  const [state, setState] = useState<{
    user: User | null;
    profile: UserProfile | null;
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: null,
    profile: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setState(s => ({...s, isUserLoading: false}));
      return;
    };

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!firebaseUser) {
        setState({
          user: null,
          profile: null,
          isUserLoading: false,
          userError: null,
        });
        return;
      }

      setState(s => ({ ...s, user: firebaseUser, isUserLoading: true }));

      const userRef = doc(firestore, 'users', firebaseUser.uid);

      try {
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // Check if any other user exists to determine if this is the first user
          const usersQuery = query(collection(firestore, 'users'), limit(2)); // Check for more than 1 document
          const existingUsersSnap = await getDocs(usersQuery);
          
          // isFirstUser is true if there are no other documents or only this user's (which is not created yet)
          const isFirstUser = existingUsersSnap.docs.filter(d => d.id !== firebaseUser.uid).length === 0;

          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Novo Usuário',
            email: firebaseUser.email || '',
            // If first user, grant admin permissions, otherwise default permissions.
            permissions: isFirstUser ? adminPermissions : defaultPermissions,
            photoURL: firebaseUser.photoURL || '',
          };
          
          try {
            await setDoc(userRef, newUserProfile);
          } catch(e) {
             console.error("Error creating user profile: ", e);
             signOut(auth);
             setState({ user: null, profile: null, isUserLoading: false, userError: e as Error });
             return;
          }
        }
        
        unsubscribeProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
             const profileData = snap.data() as UserProfile;
             if (!profileData.uid) {
                profileData.uid = snap.id;
             }
             setState({
              user: firebaseUser,
              profile: profileData,
              isUserLoading: false,
              userError: null,
            });
          } else {
             signOut(auth);
             setState({
                user: null,
                profile: null,
                isUserLoading: false,
                userError: new Error('Seu perfil de usuário foi removido. Contate um administrador.'),
            });
          }
        }, (error) => {
           console.error("Error listening to profile changes:", error);
           setState({ user: firebaseUser, profile: null, isUserLoading: false, userError: error });
        });

      } catch (error: any) {
        console.error("Error setting up user profile listener:", error);
        setState({
          user: firebaseUser,
          profile: null,
          isUserLoading: false,
          userError: error,
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [auth, firestore]);

  const value = useMemo(
    () => ({
      areServicesAvailable:
        !!firebaseApp && !!firestore && !!auth && !!storage,
      firebaseApp,
      firestore,
      auth,
      storage,
      user: state.user,
      profile: state.profile,
      isUserLoading: state.isUserLoading,
      userError: state.userError,
    }),
    [firebaseApp, firestore, auth, storage, state]
  );

  return (
    <FirebaseContext.Provider value={value}>
       <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error('useFirebase must be used inside FirebaseProvider');
  if (!ctx.areServicesAvailable)
    throw new Error('Firebase core services not available');
  return ctx;
}

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore!;
export const useStorage = () => useFirebase().storage!;
export const useUser = () => {
  const { user, profile, isUserLoading, userError } = useFirebase();
  return { user, profile, isUserLoading, userError };
};
