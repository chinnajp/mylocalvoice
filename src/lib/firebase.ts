import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

export const useMockData =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false' ||
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey === 'your_api_key'

/**
 * Firebase Cloud Functions (needs Blaze). Opt-in only — Spark stays off.
 * Prefer Vercel OTP API on Spark: see useOtpApi.
 */
export const useCloudFunctions = import.meta.env.VITE_USE_CLOUD_FUNCTIONS === 'true'

/**
 * Vercel /api OTP + status SMS (works on Firebase Spark).
 * On when explicitly enabled, or in production with live Firebase and no Cloud Functions.
 */
export const useOtpApi =
  import.meta.env.VITE_USE_OTP_API === 'true' ||
  (!useMockData && !useCloudFunctions && import.meta.env.PROD && import.meta.env.VITE_USE_OTP_API !== 'false')

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let functions: Functions | null = null
let emulatorsConnected = false

if (!useMockData) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  if (useCloudFunctions) {
    functions = getFunctions(app)
  }

  if (useEmulator && !emulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectStorageEmulator(storage, '127.0.0.1', 9199)
    if (functions) {
      connectFunctionsEmulator(functions, '127.0.0.1', 5001)
    }
    emulatorsConnected = true
  }
}

export { app, auth, db, storage, functions, useEmulator }

/**
 * Multi-village architecture:
 * Firestore collections are scoped by villageId:
 *   villages/{villageId}
 *   villages/{villageId}/complaints/{id}
 *   villages/{villageId}/announcements/{id}
 *   villages/{villageId}/activityLog/{id}
 *   admins/{uid}  → { villageId, role }
 */
export function villagePath(villageId: string, ...segments: string[]) {
  return ['villages', villageId, ...segments].join('/')
}
