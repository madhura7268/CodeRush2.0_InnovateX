/**
 * NotFound — 404 Page
 */

import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #080d18 70%)' }}>
      <div className="text-center space-y-6 animate-slide-up">
        <div className="flex justify-center">
          <AlertCircle size={64} className="text-brand-500 opacity-60" />
        </div>
        <div>
          <h1 className="text-7xl font-black text-gradient">404</h1>
          <p className="text-xl font-semibold text-white mt-2">Page Not Found</p>
          <p className="text-sm text-muted mt-2">
            The research agent couldn't find what you're looking for.
          </p>
        </div>
        <Link to="/dashboard" id="go-home-btn" className="btn-primary inline-flex">
          <Home size={16} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
