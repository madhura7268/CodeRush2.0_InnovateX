/**
 * Governance Page — Policy Registry & Safety Audit Center
 *
 * Color Palette: White + Royal Blue (#2563EB)
 */

import GovernancePanel from '@/components/GovernancePanel'

export default function GovernancePage() {
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          System <span className="text-blue-600">Governance</span> & Security Shield
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Policy enforcement registry, permission checks, & complete audit trail for all autonomous agent actions.
        </p>
      </div>

      <GovernancePanel />
    </div>
  )
}
