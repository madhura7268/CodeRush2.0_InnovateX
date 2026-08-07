/**
 * App.tsx — Root Application Component with Routes & Providers
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { AgentProvider } from '@/contexts/AgentContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/layouts/DashboardLayout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import HistoryPage from '@/pages/History'
import GovernancePage from '@/pages/Governance'
import ReportPage from '@/pages/Report'
import SettingsPage from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <AgentProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected AE-02 Research Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/research" element={<Navigate to="/report" replace />} />
                <Route path="/research/:sessionId" element={<Navigate to="/report" replace />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/governance" element={<GovernancePage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Fallback Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AgentProvider>
    </AuthProvider>
  )
}
