
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
import { Firestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
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
  permissions: Record<keyof ModulePermissions, ModulePermissions>;
  companyIds: string[];
  photoURL?: string;
}

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
    if (!auth || !firestore) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({
          user: null,
          profile: null,
          isUserLoading: false,
          userError: null,
        });
        return;
      }

      // Start loading when we have a firebaseUser
      setState(s => ({ ...s, isUserLoading: true }));

      try {
        const userRef = doc(firestore, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        // If user document doesn't exist, they are not authorized. Log them out.
        if (!userSnap.exists() || !userSnap.data().permissions) {
          await signOut(auth);
          setState({
            user: null,
            profile: null,
            isUserLoading: false,
            userError: new Error(
              'Seu perfil de usuário não foi encontrado ou está incompleto. Contate um administrador.'
            ),
          });
          return;
        }

        // Profile exists, so we subscribe to real-time changes
        const unsubscribeProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
             setState({
              user: firebaseUser,
              profile: snap.data() as UserProfile,
              isUserLoading: false,
              userError: null,
            });
          } else {
            // This case might happen if the user is deleted while they are logged in.
             signOut(auth);
             setState({
                user: null,
                profile: null,
                isUserLoading: false,
                userError: new Error('Seu perfil foi removido do sistema.'),
            });
          }
        }, (error) => {
           // Handle errors on the snapshot listener itself
           console.error("Error listening to profile changes:", error);
           setState({ user: firebaseUser, profile: null, isUserLoading: false, userError: error });
        });

        // Return the cleanup function for the profile listener
        return () => unsubscribeProfile();
      } catch (error: any) {
        console.error("Error checking user profile:", error);
        setState({
          user: null,
          profile: null,
          isUserLoading: false,
          userError: error,
        });
      }
    });

    // Return the cleanup function for the auth state listener
    return () => unsubscribe();
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
