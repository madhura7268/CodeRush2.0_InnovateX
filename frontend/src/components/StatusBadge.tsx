/**
 * StatusBadge — Displays a colored status badge for session/step status.
 */

import type { SessionStatus, StepStatus } from '@/types'
import { getStatusBadgeClass, formatSessionStatus } from '@/utils/formatters'

interface StatusBadgeProps {
  status: SessionStatus | StepStatus
  showDot?: boolean
}

const DOT_COLORS: Record<string, string> = {
  pending: 'bg-slate-400',
  planning: 'bg-brand-400 animate-pulse',
  running: 'bg-brand-400 animate-pulse',
  paused: 'bg-yellow-400',
  evaluating: 'bg-accent-400 animate-pulse',
  completed: 'bg-emerald-400',
  failed: 'bg-red-400',
  cancelled: 'bg-orange-400',
  skipped: 'bg-slate-400',
  blocked: 'bg-red-400',
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  return (
    <span className={getStatusBadgeClass(status)}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status] ?? 'bg-slate-400'}`} />
      )}
      {formatSessionStatus(status as SessionStatus)}
    </span>
  )
}
