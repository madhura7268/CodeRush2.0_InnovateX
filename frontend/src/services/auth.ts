/**
 * Centralized Authentication Service
 *
 * Encapsulates Firebase Authentication API calls & error translations.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

const MOCK_USER_STORAGE_KEY = 'ae02_demo_user'

/** Format a FirebaseUser into a simple UserProfile */
export function formatUserProfile(user: FirebaseUser): UserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Researcher',
    photoURL: user.photoURL,
  }
}

/** Translate raw Firebase error codes into clean user-friendly messages */
export function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || ''
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address format is invalid.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.'
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists.'
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.'
    case 'auth/user-disabled':
      return 'This user account has been disabled.'
    default:
      return error?.message || 'Authentication failed. Please try again.'
  }
}

/** Register new user */
export async function signUp(name: string, email: string, pass: string): Promise<UserProfile> {
  if (!isFirebaseConfigured) {
    // Local Demo / Fallback Authentication Mode
    const demoUser: UserProfile = {
      uid: 'demo-' + Date.now(),
      email,
      displayName: name,
      photoURL: null,
    }
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(demoUser))
    return demoUser
  }

  const credential = await createUserWithEmailAndPassword(auth, email, pass)
  if (name && credential.user) {
    await updateProfile(credential.user, { displayName: name })
  }
  return formatUserProfile(credential.user)
}

/** Login existing user */
export async function login(email: string, pass: string): Promise<UserProfile> {
  if (!isFirebaseConfigured) {
    // Local Demo / Fallback Authentication Mode
    const demoUser: UserProfile = {
      uid: 'demo-user-123',
      email,
      displayName: email.split('@')[0] || 'Researcher',
      photoURL: null,
    }
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(demoUser))
    return demoUser
  }

  const credential = await signInWithEmailAndPassword(auth, email, pass)
  return formatUserProfile(credential.user)
}

/** Logout user */
export async function logout(): Promise<void> {
  if (!isFirebaseConfigured) {
    localStorage.removeItem(MOCK_USER_STORAGE_KEY)
    return
  }
  await signOut(auth)
}

/** Send password reset email */
export async function resetPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured) {
    return
  }
  await sendPasswordResetEmail(auth, email)
}

/** Get current user synchronous snapshot */
export function getCurrentUser(): UserProfile | null {
  if (!isFirebaseConfigured) {
    const saved = localStorage.getItem(MOCK_USER_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  }
  return auth.currentUser ? formatUserProfile(auth.currentUser) : null
}

/** Subscribe to auth state changes */
export function subscribeToAuthState(callback: (user: UserProfile | null) => void): () => void {
  if (!isFirebaseConfigured) {
    const checkDemoUser = () => {
      const saved = localStorage.getItem(MOCK_USER_STORAGE_KEY)
      callback(saved ? JSON.parse(saved) : null)
    }
    checkDemoUser()
    window.addEventListener('storage', checkDemoUser)
    return () => window.removeEventListener('storage', checkDemoUser)
  }

  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    callback(firebaseUser ? formatUserProfile(firebaseUser) : null)
  })
}
