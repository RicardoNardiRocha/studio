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

// Função para migrar/criar o perfil do usuário no novo formato
const provisionUserProfile = async (firestore: Firestore, user: User): Promise<UserProfile> => {
    const userDocRef = doc(firestore, 'users', user.uid);
    let userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }

    // Se não existe, tenta descobrir a role antiga e migra
    let roleId: UserProfile['roleId'] = 'usuario'; // Default
    let isAdmin = false;
    let canFinance = false;

    const ownerRef = doc(firestore, 'roles_OWNER', user.uid);
    const adminRef = doc(firestore, 'roles_admin', user.uid);
    const financeRef = doc(firestore, 'roles_finance', user.uid);
    
    const [ownerSnap, adminSnap, financeSnap] = await Promise.all([
        getDoc(ownerRef),
        getDoc(adminRef),
        getDoc(financeSnap)
    ]);
    
    if (ownerSnap.exists()) {
        roleId = 'owner';
        isAdmin = true;
        canFinance = true;
    } else if (adminSnap.exists()) {
        roleId = 'admin';
        isAdmin = true;
    }
    
    if (financeSnap.exists()) {
        canFinance = true;
    }

    const newUserProfile: UserProfile = {
        userId: user.uid,
        displayName: user.displayName || 'Usuário',
        email: user.email || '',
        roleId: roleId,
        companyIds: [],
        isAdmin: isAdmin,
        canFinance: canFinance,
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // CORREÇÃO: Salva o novo perfil no banco de dados se ele não existir
    await setDoc(userDocRef, newUserProfile);
    
    // Retorna o perfil recém-criado
    const createdDoc = await getDoc(userDocRef);
    if (!createdDoc.exists()) {
        throw new Error("Falha ao criar e recuperar o perfil do usuário após a migração.");
    }
    return createdDoc.data() as UserProfile;
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

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const profile = await provisionUserProfile(firestore, firebaseUser);
            setAuthState({
              user: firebaseUser,
              profile: profile,
              isUserLoading: false,
              userError: null,
            });
            // Após a migração/criação, podemos ouvir por updates em tempo real.
            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setAuthState(current => ({...current, profile: docSnap.data() as UserProfile}));
                }
            });

          } catch (error: any) {
             setAuthState({
                user: firebaseUser,
                profile: null,
                isUserLoading: false,
                userError: error,
              });
          }
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
