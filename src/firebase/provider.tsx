
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
  permissions: Record<string, ModulePermissions>;
  companyIds?: string[];
  photoURL?: string;
  isAdmin?: boolean;
  roleId?: string;
  canFinance?: boolean;
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
    if (!auth || !firestore) {
      setState(s => ({...s, isUserLoading: false}));
      return;
    };

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
        
        // Use onSnapshot to listen for real-time updates
        const unsubscribeProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
             const profileData = snap.data() as UserProfile;
             // Ensure UID is present, for backward compatibility
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
            // Document does not exist, sign out user
             signOut(auth);
             setState({
                user: null,
                profile: null,
                isUserLoading: false,
                userError: new Error('Seu perfil de usuário não foi encontrado. Contate um administrador.'),
            });
          }
        }, (error) => {
           // Handle errors on the snapshot listener itself (e.g., permissions)
           console.error("Error listening to profile changes:", error);
           setState({ user: firebaseUser, profile: null, isUserLoading: false, userError: error });
        });

        // Return the cleanup function for the profile listener
        return () => unsubscribeProfile();

      } catch (error: any) {
        console.error("Error setting up user profile listener:", error);
        setState({
          user: firebaseUser, // keep user, but profile is unavailable
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
