/**
 * DashboardLayout — Shared layout with sidebar and top navbar.
 *
 * All page routes render inside the <Outlet /> content area.
 */

import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* ---- Sidebar ---- */}
      <Sidebar />

      {/* ---- Main Content Area ---- */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
