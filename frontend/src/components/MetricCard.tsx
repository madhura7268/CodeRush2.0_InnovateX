/**
 * MetricCard — A KPI card for displaying key metrics.
 *
 * Color Palette: White + Royal Blue (#2563EB)
 * - Card: #FFFFFF
 * - Border: #E2E8F0
 * - Number: #2563EB
 * - Label: #64748B
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

export default function MetricCard({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  trend,
  trendValue,
}: MetricCardProps) {
  return (
    <div
      id={id}
      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2 transition-all hover:border-slate-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold text-blue-600 leading-none">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 border border-blue-100">
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      {trend && trendValue && (
        <div className={clsx(
          'flex items-center gap-1 text-xs font-semibold mt-1',
          trend === 'up' && 'text-emerald-600',
          trend === 'down' && 'text-red-600',
          trend === 'neutral' && 'text-slate-500',
        )}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}
