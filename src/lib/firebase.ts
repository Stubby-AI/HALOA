import { initializeApp } from 'firebase/app';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';

import { getStorage } from 'firebase/storage';

// Firebase Config from ENV
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider =
  new GoogleAuthProvider();

// ========================================
// Firebase Connection Test
// ========================================
async function testConnection() {
  try {
    await getDocFromServer(
      doc(db, 'test', 'connection')
    );

    console.log(
      '✅ Firebase Connected Successfully'
    );
  } catch (error) {
    console.error(
      '❌ Firebase Connection Error:',
      error
    );

    if (
      error instanceof Error &&
      error.message.includes('offline')
    ) {
      console.error(
        'Please check your Firebase configuration.'
      );
    }
  }
}

testConnection();

// ========================================
// Google Sign In
// ========================================
let isSigningIn = false;

export const signInWithGoogle = async () => {
  if (isSigningIn) return null;

  isSigningIn = true;

  try {
    const result = await signInWithPopup(
      auth,
      googleProvider
    );

    console.log('✅ Login Successful');

    return result;
  } catch (error: any) {
    console.error(
      '❌ Google Sign In Error:',
      error
    );

    if (
      error.code ===
        'auth/cancelled-popup-request' ||
      error.code ===
        'auth/popup-closed-by-user'
    ) {
      console.warn(
        'Sign-in popup closed or cancelled.'
      );

      return null;
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

// ========================================
// Logout
// ========================================
export const logOut = async () => {
  try {
    await signOut(auth);

    console.log('✅ Logout Successful');
  } catch (error) {
    console.error('❌ Logout Error:', error);
  }
};

// ========================================
// Firestore Error Handling
// ========================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;

  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;

    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error:
      error instanceof Error
        ? error.message
        : String(error),

    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified:
        auth.currentUser?.emailVerified,

      isAnonymous:
        auth.currentUser?.isAnonymous,

      tenantId: auth.currentUser?.tenantId,

      providerInfo:
        auth.currentUser?.providerData?.map(
          (provider) => ({
            providerId: provider.providerId,
            email: provider.email,
          })
        ) || [],
    },

    operationType,
    path,
  };

  console.error(
    '🔥 Firestore Error:',
    JSON.stringify(errInfo, null, 2)
  );

  throw new Error(JSON.stringify(errInfo));
}