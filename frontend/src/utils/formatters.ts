/**
 * Utility functions for formatting and displaying data.
 */

import type { SessionStatus, StepStatus } from '@/types'

/** Format a confidence score (0-1) as a percentage string */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`
}

/** Format a relative timestamp (e.g., "2 minutes ago") */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

/** Format a full date and time */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format a history item timestamp to human-friendly local time (e.g., "08 Aug 2026, 06:26 AM") */
export function formatHistoryDate(dateStr: string): string {
  if (!dateStr) return ''
  let iso = dateStr
  if (iso.includes(' ') && !iso.includes('T')) {
    iso = iso.replace(' ', 'T') + 'Z'
  } else if (!iso.endsWith('Z') && !iso.includes('+')) {
    iso = iso + 'Z'
  }
  const d = new Date(iso)
  if (isNaN(d.getTime())) return dateStr

  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = d.getFullYear()
  const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${day} ${month} ${year}, ${time}`
}

/** Truncate a long string with ellipsis */
export function truncate(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/** Convert a session status to a human-readable label */
export function formatSessionStatus(status: SessionStatus): string {
  const labels: Record<SessionStatus, string> = {
    pending: 'Pending',
    planning: 'Planning',
    running: 'Running',
    paused: 'Paused',
    evaluating: 'Evaluating',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  }
  return labels[status] ?? status
}

/** Get Tailwind badge class for a status */
export function getStatusBadgeClass(status: SessionStatus | StepStatus): string {
  const classes: Record<string, string> = {
    pending: 'badge-pending',
    planning: 'badge-running',
    running: 'badge-running',
    paused: 'badge-paused',
    evaluating: 'badge-running',
    completed: 'badge-completed',
    failed: 'badge-failed',
    cancelled: 'badge-cancelled',
    skipped: 'badge-pending',
    blocked: 'badge-blocked',
  }
  return classes[status] ?? 'badge-pending'
}

/** Format a duration in milliseconds to a human-readable string */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}m ${secs}s`
}
