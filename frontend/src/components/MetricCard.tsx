/**
 * MetricCard — A KPI card for displaying a key metric with icon and trend.
 */

import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface MetricCardProps {
  id: string
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  glow?: 'brand' | 'accent' | 'success' | 'none'
}

const GLOW_CLASSES = {
  brand: 'shadow-glow-brand',
  accent: 'shadow-glow-accent',
  success: 'shadow-[0_0_24px_rgba(16,185,129,0.3)]',
  none: '',
}

export default function MetricCard({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-400',
  trend,
  trendValue,
  glow = 'none',
}: MetricCardProps) {
  return (
    <div
      id={id}
      className={clsx('metric-card animate-slide-up', GLOW_CLASSES[glow])}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-white leading-none">{value}</p>
          {subtitle && <p className="text-xs text-subtle mt-0.5">{subtitle}</p>}
        </div>
        <div className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          'bg-white/5 border border-white/5'
        )}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      {trend && trendValue && (
        <div className={clsx(
          'flex items-center gap-1 text-xs font-medium',
          trend === 'up' && 'text-emerald-400',
          trend === 'down' && 'text-red-400',
          trend === 'neutral' && 'text-slate-400',
        )}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}
