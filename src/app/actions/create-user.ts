'use server';

import * as admin from 'firebase-admin';
import { z } from 'zod';
import { setDoc, doc, getFirestore } from 'firebase/firestore';

const formSchema = z.object({
  displayName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
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

  return admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
  });
}

export async function createUser(data: CreateUserInput) {
  try {
    const app = initializeFirebaseAdmin();
    const auth = admin.auth(app);
    const firestore = admin.firestore(app);

    // Validate input data
    const validatedData = formSchema.parse(data);

    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: validatedData.email,
      password: validatedData.password,
      displayName: validatedData.displayName,
      emailVerified: true, // Or false, depending on your flow
    });

    // Create user document in Firestore
    const userDocRef = firestore.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      displayName: validatedData.displayName,
      email: validatedData.email,
      photoURL: userRecord.photoURL || '',
      roleId: validatedData.roleId,
    });

    return {
      uid: userRecord.uid,
      message: 'User created successfully',
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    let errorMessage = 'An unknown error occurred.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'Este e-mail já está em uso por outra conta.';
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = 'A senha é inválida. Ela deve ter no mínimo 6 caracteres.';
    } else if (error instanceof z.ZodError) {
        errorMessage = `Validation error: ${error.errors.map(e => e.message).join(', ')}`;
    } else if (error.message) {
        errorMessage = error.message;
    }

    return {
      error: errorMessage,
    };
  }
}
