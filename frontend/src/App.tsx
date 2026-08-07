/**
 * App.tsx — Root application component with routing and context providers.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AgentProvider } from '@/contexts/AgentContext'
import DashboardLayout from '@/layouts/DashboardLayout'
import Dashboard from '@/pages/Dashboard'
import ResearchPlanPage from '@/pages/ResearchPlan'
import GovernancePage from '@/pages/Governance'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <AgentProvider>
      <BrowserRouter>
        <Routes>
          {/* All routes use the shared DashboardLayout */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="research/:sessionId?" element={<ResearchPlanPage />} />
            <Route path="governance" element={<GovernancePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AgentProvider>
  )
}
