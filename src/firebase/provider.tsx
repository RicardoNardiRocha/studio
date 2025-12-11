
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
  uid: string;
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

// This function checks for a user profile and creates one if it doesn't exist.
// It includes a hardcoded check to ensure the primary user is always an 'owner'.
const provisionUserProfile = async (firestore: Firestore, user: User): Promise<UserProfile> => {
    const userDocRef = doc(firestore, 'users', user.uid);
    
    // First, try to get the document.
    const userDoc = await getDoc(userDocRef);

    // If the document already exists, return its data.
    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }

    // If the document does NOT exist, we create it.
    // This is the critical step for migration.
    
    // Hardcode the owner's UID to ensure they get the correct role.
    const isOwner = user.uid === 'wK9BRBsngobSOBFZEYacPLYAHXl2';
    
    const newUserProfile: UserProfile = {
        uid: user.uid, // Ensure the UID is saved in the document
        displayName: user.displayName || 'Novo Usuário',
        email: user.email || '',
        roleId: isOwner ? 'owner' : 'usuario', // Default to 'usuario' if not the owner
        isAdmin: isOwner, // Only the owner is admin by default on creation
        canFinance: isOwner, // Only the owner has finance access by default
        companyIds: [],
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // Save the new profile to the database. This write is allowed by the new security rules.
    await setDoc(userDocRef, newUserProfile);
    
    // Return the newly created profile.
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

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setAuthState(current => ({ ...current, isUserLoading: true, userError: null, profile: null }));
        if (firebaseUser) {
          try {
            // This function will now reliably create and/or fetch the user profile.
            const profile = await provisionUserProfile(firestore, firebaseUser);
            setAuthState({
              user: firebaseUser,
              profile: profile,
              isUserLoading: false,
              userError: null,
            });

            // Listen for real-time updates to the profile after it's been provisioned.
            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setAuthState(current => ({...current, profile: docSnap.data() as UserProfile}));
                }
            }, (error) => {
                 setAuthState(current => ({ ...current, userError: error }));
            });

            return () => unsubscribeProfile(); // Cleanup the profile listener

          } catch (error: any) {
             setAuthState({
                user: firebaseUser,
                profile: null,
                isUserLoading: false,
                userError: error,
              });
          }
        } else {
          // No user logged in, finish loading.
          setAuthState({ user: null, profile: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        // Error during auth state change, finish loading.
        setAuthState({
          user: null,
          profile: null,
          isUserLoading: false,
          userError: error,
        });
      }
    );

    return () => unsubscribeAuth(); // Cleanup the auth listener
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
