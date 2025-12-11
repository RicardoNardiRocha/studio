'use server';

import * as admin from 'firebase-admin';
import { z } from 'zod';

// Schema for provisioning a user profile in Firestore
const formSchema = z.object({
  displayName: z.string().min(3),
  email: z.string().email(),
  roleId: z.string(),
});

type CreateUserInput = z.infer<typeof formSchema>;

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } catch (error: any) {
    console.error("Error initializing Firebase Admin:", error);
    throw new Error("Could not initialize Firebase Admin SDK. Check service account credentials.");
  }
}

/**
 * Creates a user profile document in Firestore for an existing Firebase Auth user.
 * @param data - The user profile data including displayName, email, and roleId.
 * @returns An object with the user's UID and a success message, or an error object.
 */
export async function createUser(data: CreateUserInput) {
  try {
    const app = initializeFirebaseAdmin();
    const auth = admin.auth(app);
    const firestore = admin.firestore(app);

    const validatedData = formSchema.parse(data);

    // 1. Verify user exists in Firebase Authentication by email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(validatedData.email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`O e-mail "${validatedData.email}" não pertence a um usuário de autenticação existente. Crie a conta de login no painel do Firebase primeiro.`);
      }
      throw error; // Re-throw other auth errors
    }

    // 2. Check if a profile already exists in Firestore for this UID
    const userDocRef = firestore.collection('users').doc(userRecord.uid);
    const userDocSnap = await userDocRef.get();
    if (userDocSnap.exists) {
      throw new Error(`Um perfil de usuário para ${validatedData.email} já existe no sistema.`);
    }

    // 3. Create the user profile document in Firestore
    await userDocRef.set({
      uid: userRecord.uid,
      displayName: validatedData.displayName,
      email: validatedData.email,
      photoURL: userRecord.photoURL || '',
      roleId: validatedData.roleId,
    });
    
    // Grant special roles if necessary
    if (validatedData.roleId === 'admin') {
      await firestore.collection('roles_admin').doc(userRecord.uid).set({});
    }
     if (validatedData.roleId === 'finance') {
      await firestore.collection('roles_finance').doc(userRecord.uid).set({});
    }


    return {
      uid: userRecord.uid,
      message: 'User profile created successfully',
    };
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof z.ZodError) {
      errorMessage = `Validation error: ${error.errors.map(e => e.message).join(', ')}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      error: errorMessage,
    };
  }
}
