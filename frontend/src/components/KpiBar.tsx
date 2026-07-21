import { useEffect, useRef } from 'react'
import type { CrisisEvent, Stats } from '../api'
import type { Role } from './Sidebar'

interface KpiDef {
  label: string
  value: string | number
  sub: string
  icon: string
  iconBg: string
  iconColor: string
  trend?: { value: string; up: boolean } | null
}

function getKpis(role: Role, events: CrisisEvent[], stats: Stats | null): KpiDef[] {
  const total = stats?.total ?? events.length
  const critical = stats?.critical ?? events.filter(e => e.severity === 'critical').length
  const high = stats?.high ?? events.filter(e => e.severity === 'high').length
  const medium = stats?.medium ?? events.filter(e => e.severity === 'medium').length
  const low = stats?.low ?? events.filter(e => e.severity === 'low').length
  const verified = stats?.verified ?? events.filter(e => e.official_confirmed).length
  const countries = stats?.countries ?? new Set(events.map(e => e.country_iso).filter(Boolean)).size
  const avgConf = stats?.avg_confidence ?? (total ? events.reduce((s, e) => s + e.system_confidence, 0) / total : 0)

  if (role === 'citizen') return [
    { label: 'Active Alerts', value: critical + high, sub: `↑ ${critical} Last 24h`, icon: '📡', iconBg: 'bg-red-100', iconColor: 'text-red-600', trend: { value: `+${critical}`, up: false } },
    { label: 'High Severity', value: high, sub: `↑ ${high} Last 24h`, icon: '⚡', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', trend: null },
    { label: 'Medium Severity', value: medium, sub: '— Last 24h', icon: '⚠️', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', trend: null },
    { label: 'Low Severity', value: low, sub: `↓ ${low} Last 24h`, icon: '✅', iconBg: 'bg-green-100', iconColor: 'text-green-600', trend: null },
    { label: 'People Affected', value: '1,250+', sub: 'Across All Events', icon: '👥', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trend: null },
    { label: 'Shelters Open', value: 12, sub: 'Across Indonesia', icon: '🏠', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', trend: null },
  ]

  if (role === 'tourist') return [
    { label: 'Safety Status', value: critical === 0 ? 'Good' : 'Warning', sub: critical === 0 ? 'No major threats' : `${critical} active threats`, icon: '🛡️', iconBg: critical === 0 ? 'bg-green-100' : 'bg-red-100', iconColor: critical === 0 ? 'text-green-600' : 'text-red-600', trend: null },
    { label: 'Active Alerts', value: critical + high, sub: 'See alerts', icon: '🔺', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', trend: null },
    { label: 'High Risk Areas', value: critical, sub: 'View on Map', icon: '☀️', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', trend: null },
    { label: 'Tourists in Bali', value: '125,430', sub: 'Today', icon: '👥', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trend: null },
    { label: 'Emergency Services', value: 91, sub: 'Available', icon: '🧳', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', trend: null },
    { label: 'Weather', value: '28°C', sub: 'Partly Cloudy', icon: '🌤️', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', trend: null },
  ]

  if (role === 'responder') return [
    { label: 'Active Incidents', value: critical + high, sub: `↑ ${critical + high} vs last 24h`, icon: '🆘', iconBg: 'bg-red-100', iconColor: 'text-red-600', trend: { value: `+${critical}`, up: false } },
    { label: 'High Priority', value: critical, sub: `↑ ${critical} vs last 24h`, icon: '⚡', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', trend: null },
    { label: 'Teams Deployed', value: 3, sub: '— vs last 24h', icon: '👥', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', trend: null },
    { label: 'Resources Ready', value: 18, sub: `↑ 4 vs last 24h`, icon: '✅', iconBg: 'bg-green-100', iconColor: 'text-green-600', trend: null },
    { label: 'People Affected', value: '1,250+', sub: 'Across Bali', icon: '👥', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trend: null },
    { label: 'Shelters Open', value: 3, sub: 'Across Bali', icon: '🏠', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', trend: null },
  ]

  // Government
  return [
    { label: 'Total Events', value: total, sub: 'Last 24 hours', icon: '📊', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', trend: null },
    { label: 'Critical Events', value: critical, sub: 'Requiring immediate action', icon: '🔺', iconBg: 'bg-red-100', iconColor: 'text-red-600', trend: null },
    { label: 'Verified Events', value: verified, sub: 'Officially confirmed', icon: '✅', iconBg: 'bg-green-100', iconColor: 'text-green-600', trend: null },
    { label: 'Countries Affected', value: countries || 1, sub: 'Coordination needed', icon: '🌍', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', trend: null },
  ]
}

interface KpiCardProps extends KpiDef {
  darkMode: boolean
  animate: boolean
}

function KpiCard({ label, value, sub, icon, iconBg, iconColor, trend, darkMode, animate }: KpiCardProps) {
  const isCritical = label === 'Active Alerts' || label === 'Critical Events' || label === 'Active Incidents'
  const criticalHigh = typeof value === 'number' && value > 0 && isCritical

  return (
    <div className={`rounded-2xl p-4 border flex items-start gap-3 ${animate ? 'fade-in' : ''} ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
    } ${criticalHigh ? 'ring-1 ring-red-200' : ''}`}>
      {/* Icon */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${iconBg} ${criticalHigh ? 'relative' : ''}`}>
        {criticalHigh && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-red-400" />
        )}
        <span className="relative">{icon}</span>
      </div>
      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className={`text-2xl font-bold kpi-number ${
          isCritical && typeof value === 'number' && value > 0 ? 'text-red-500' : darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {value}
        </div>
        <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
        <div className={`text-xs mt-0.5 flex items-center gap-1 ${
          sub.startsWith('↑') ? 'text-red-500' : sub.startsWith('↓') ? 'text-green-500' : darkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {sub}
        </div>
      </div>
    </div>
  )
}

interface Props {
  role: Role
  events: CrisisEvent[]
  stats: Stats | null
  darkMode: boolean
}

export default function KpiBar({ role, events, stats, darkMode }: Props) {
  const kpis = getKpis(role, events, stats)

  return (
    <div className={`grid gap-3 ${
      kpis.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6'
    }`}>
      {kpis.map((kpi, i) => (
        <KpiCard key={kpi.label} {...kpi} darkMode={darkMode} animate={i < 4} />
      ))}
    </div>
  )
}
