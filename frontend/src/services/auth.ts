/**
 * Centralized Authentication Service
 *
 * Communicates with FastAPI Backend (/api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout).
 */

import axios from 'axios'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
}

export interface AuthResponse {
  success: boolean
  access_token: string
  token_type: string
  user: UserProfile
}

const AUTH_TOKEN_KEY = 'ae02_auth_token'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/** Get stored JWT token from localStorage */
export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

/** Set JWT token in localStorage */
export function setStoredAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

/** Remove JWT token from localStorage */
export function clearStoredAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

/** Register new user via FastAPI backend */
export async function signUp(name: string, email: string, pass: string): Promise<UserProfile> {
  try {
    const res = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, {
      name,
      email,
      password: pass,
    })
    if (res.data?.access_token) {
      setStoredAuthToken(res.data.access_token)
    }
    return res.data.user
  } catch (error: any) {
    const msg = error?.response?.data?.detail || error?.message || 'Registration failed. Please try again.'
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
}

/** Login existing user via FastAPI backend */
export async function login(email: string, pass: string): Promise<UserProfile> {
  try {
    const res = await axios.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, {
      email,
      password: pass,
    })
    if (res.data?.access_token) {
      setStoredAuthToken(res.data.access_token)
    }
    return res.data.user
  } catch (error: any) {
    const msg = error?.response?.data?.detail || error?.message || 'Login failed. Please check credentials.'
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
}

/** Logout user */
export async function logout(): Promise<void> {
  const token = getStoredAuthToken()
  if (token) {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch {
      // Ignore logout errors
    }
  }
  clearStoredAuthToken()
}

/** Send password reset (stub for UI compatibility) */
export async function resetPassword(email: string): Promise<void> {
  console.info('Password reset requested for:', email)
}

/** Fetch current user profile from backend using stored token */
export async function fetchCurrentUser(): Promise<UserProfile | null> {
  const token = getStoredAuthToken()
  if (!token) return null

  try {
    const res = await axios.get<UserProfile>(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data
  } catch (error: any) {
    clearStoredAuthToken()
    return null
  }
}

/** Translate error into user-friendly message */
export function getFirebaseErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  return error?.message || 'Authentication error occurred.'
}
