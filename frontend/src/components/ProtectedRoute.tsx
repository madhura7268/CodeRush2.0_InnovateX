/**
 * ProtectedRoute — Route Guard for Authenticated User Access
 *
 * Redirects unauthenticated users to /login.
 * Displays clean loading spinner while checking auth status.
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-700">
        <Loader2 size={32} className="text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading authentication state...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
