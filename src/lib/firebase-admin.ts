
import "server-only";
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

export function createFirebaseAdminApp(params?: FirebaseAdminConfig) {
  const privateKey = formatPrivateKey(
    params?.privateKey ?? process.env.FIREBASE_PRIVATE_KEY ?? ""
  );

  if (admin.apps.length > 0) {
    return admin.app();
  }

  const cert = {
    projectId: params?.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: params?.clientEmail ?? process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  };

  return admin.initializeApp({
    credential: admin.credential.cert(cert),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export async function initAdmin() {
  const app = createFirebaseAdminApp();
  const db = app.firestore();
  const auth = app.auth();
  const storage = app.storage();
  
  return { app, db, auth, storage };
}
