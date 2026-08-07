/**
 * Firebase Configuration & Service Initialization
 *
 * Configured via Vite environment variables or direct project credentials:
 * Project: evolvai-84fdb
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB0jIe4yT7R9ulxb24Hzyz0GXI_Qc2oRbc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'evolvai-84fdb.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'evolvai-84fdb',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'evolvai-84fdb.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '765182373647',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:765182373647:web:d1778dcb916015bde9d87a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-EEX6CX89P5',
}

/**
 * When mock data mode is active, disable Firebase so auth falls back to
 * the local-demo flow defined in auth.ts.  Otherwise Firebase is always
 * considered configured (the SDK will validate the credentials at runtime).
 */
export const isFirebaseConfigured = false

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth: Auth = getAuth(app)

export { app, auth }
