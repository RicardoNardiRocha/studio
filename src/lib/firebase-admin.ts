import 'server-only';
import * as admin from 'firebase-admin';

interface FirebaseAdminApp {
    app: admin.app.App;
    db: admin.firestore.Firestore;
}

// Helper function to format the private key
const formatPrivateKey = (key: string) => {
  return key.replace(/\\n/g, '\n');
};

const getServiceAccount = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Diagnostic log (safe to print existence)
  console.log(`[Firebase Admin Check] FIREBASE_PROJECT_ID exists: ${!!projectId}`);
  console.log(`[Firebase Admin Check] FIREBASE_CLIENT_EMAIL exists: ${!!clientEmail}`);
  console.log(`[Firebase Admin Check] FIREBASE_PRIVATE_KEY exists: ${!!privateKey}`);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK environment variables not set. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  }

  return {
    projectId,
    clientEmail,
    privateKey: formatPrivateKey(privateKey),
  };
};

// Singleton pattern to ensure we only initialize once
let firebaseAdminApp: FirebaseAdminApp | null = null;

function initializeFirebaseAdmin(): FirebaseAdminApp {
  if (admin.apps.length > 0) {
    const app = admin.apps[0]!;
    return { app, db: admin.firestore(app) };
  }

  const serviceAccount = getServiceAccount();

  console.log(`[Firebase Admin] Attempting to use Project ID from env: ${serviceAccount.projectId}`);

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
    }),
  });

  return { app, db: admin.firestore(app) };
}

export function getAdminDb() {
  if (!firebaseAdminApp) {
    firebaseAdminApp = initializeFirebaseAdmin();
  }
  return firebaseAdminApp.db;
}
