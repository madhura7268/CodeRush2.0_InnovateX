/**
 * AuthContext — Context Provider for Real Authentication State
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  UserProfile,
  login as apiLogin,
  signUp as apiRegister,
  logout as apiLogout,
  resetPassword as apiResetPassword,
  fetchCurrentUser,
  getFirebaseErrorMessage,
} from '@/services/auth'

interface AuthContextType {
  currentUser: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (name: string, email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    fetchCurrentUser().then((user) => {
      if (isMounted) {
        setCurrentUser(user)
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) {
        setCurrentUser(null)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email: string, pass: string) => {
    try {
      const user = await apiLogin(email, pass)
      setCurrentUser(user)
    } catch (err: any) {
      throw new Error(getFirebaseErrorMessage(err))
    }
  }

  const register = async (name: string, email: string, pass: string) => {
    try {
      const user = await apiRegister(name, email, pass)
      setCurrentUser(user)
    } catch (err: any) {
      throw new Error(getFirebaseErrorMessage(err))
    }
  }

  const logout = async () => {
    try {
      await apiLogout()
      setCurrentUser(null)
    } catch (err: any) {
      setCurrentUser(null)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await apiResetPassword(email)
    } catch (err: any) {
      throw new Error(getFirebaseErrorMessage(err))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated: Boolean(currentUser),
        login,
        register,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
