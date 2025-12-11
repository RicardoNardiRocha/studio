'use server';

import * as admin from 'firebase-admin';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

const formSchema = z.object({
  displayName: z.string().min(3),
  email: z.string().email(),
  roleId: z.enum(['owner', 'admin', 'contador', 'usuario']),
});

type CreateUserInput = z.infer<typeof formSchema>;

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

export async function createUser(data: CreateUserInput) {
  try {
    const app = initializeFirebaseAdmin();
    const auth = admin.auth(app);
    const firestore = admin.firestore(app);

    const validatedData = formSchema.parse(data);

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(validatedData.email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error(`O usuário com e-mail "${validatedData.email}" não existe na autenticação. Crie a conta de login no painel do Firebase primeiro.`);
      }
      throw error; 
    }

    const userDocRef = firestore.collection('users').doc(userRecord.uid);
    const userDocSnap = await userDocRef.get();
    if (userDocSnap.exists) {
      throw new Error(`Um perfil de usuário para ${validatedData.email} já existe no sistema.`);
    }

    const newUserProfile = {
        userId: userRecord.uid,
        displayName: validatedData.displayName,
        email: validatedData.email,
        roleId: validatedData.roleId,
        companyIds: [],
        isAdmin: validatedData.roleId === 'admin' || validatedData.roleId === 'owner',
        canFinance: validatedData.roleId === 'admin' || validatedData.roleId === 'owner', // Default finance access for admin/owner
        photoURL: userRecord.photoURL || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await userDocRef.set(newUserProfile);
    
    // If the main display name in Auth is different, update it
    if(userRecord.displayName !== validatedData.displayName) {
        await auth.updateUser(userRecord.uid, { displayName: validatedData.displayName });
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
