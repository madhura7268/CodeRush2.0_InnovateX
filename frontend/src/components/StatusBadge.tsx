/**
 * StatusBadge — Displays status badge with status colors.
 */

import type { SessionStatus, StepStatus } from '@/types'
import { formatSessionStatus } from '@/utils/formatters'
import clsx from 'clsx'

interface StatusBadgeProps {
  status: SessionStatus | StepStatus
  showDot?: boolean
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'running':
      case 'planning':
      case 'evaluating':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'paused':
      case 'cancelled':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'failed':
      case 'blocked':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  const getDotStyle = (st: string) => {
    switch (st) {
      case 'completed':
        return 'bg-emerald-600'
      case 'running':
      case 'planning':
      case 'evaluating':
        return 'bg-blue-600 animate-pulse'
      case 'paused':
      case 'cancelled':
        return 'bg-amber-600'
      case 'failed':
      case 'blocked':
        return 'bg-red-600'
      default:
        return 'bg-slate-400'
    }
  }

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border', getBadgeStyle(status))}>
      {showDot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', getDotStyle(status))} />
      )}
      {formatSessionStatus(status as SessionStatus)}
    </span>
  )
}
