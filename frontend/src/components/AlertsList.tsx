import type { CrisisEvent } from '../api'

const SEV_CONFIG: Record<string, { dot: string; badge: string }> = {
  critical: { dot: 'bg-red-500',    badge: 'text-red-600 bg-red-50' },
  high:     { dot: 'bg-orange-500', badge: 'text-orange-600 bg-orange-50' },
  medium:   { dot: 'bg-yellow-500', badge: 'text-yellow-700 bg-yellow-50' },
  low:      { dot: 'bg-green-500',  badge: 'text-green-700 bg-green-50' },
}

const TYPE_ICON: Record<string, string> = {
  earthquake: '🔴', flood: '💧', volcano: '🌋', wildfire: '🔥',
  landslide: '⛰️', storm: '🌀', disease: '🦠', tsunami: '🌊', other: '⚠️',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (isNaN(mins) || mins < 0) return ''
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  events: CrisisEvent[]
  darkMode: boolean
  maxItems?: number
}

export default function AlertsList({ events, darkMode, maxItems = 5 }: Props) {
  const sorted = [...events]
    .sort((a, b) => {
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return (sevOrder[a.severity as keyof typeof sevOrder] ?? 4) - (sevOrder[b.severity as keyof typeof sevOrder] ?? 4)
    })
    .slice(0, maxItems)

  return (
    <div className={`rounded-2xl border p-4 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className={`flex items-center justify-between mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">🔔</span>
          <span className="font-semibold text-sm">Active Alerts</span>
        </div>
        <button className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          View All
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className={`text-center py-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          No active alerts — all clear ✅
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(e => {
            const sev = SEV_CONFIG[e.severity] || SEV_CONFIG.low
            return (
              <div key={e.id} className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              } slide-in-right`}>
                <span className="text-lg flex-shrink-0">{TYPE_ICON[e.crisis_type] || '⚠️'}</span>
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-2 flex-wrap`}>
                    <span className={`text-xs font-semibold uppercase ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {e.crisis_type}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sev.badge}`}>
                      {e.severity}
                    </span>
                  </div>
                  <div className={`text-xs truncate mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {e.location_name || e.country_iso || 'Unknown location'}
                  </div>
                  <div className={`text-xs mt-0.5 flex gap-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>🎯 {(e.system_confidence * 100).toFixed(0)}%</span>
                    {e.event_date && <span>• {timeAgo(e.event_date)}</span>}
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${sev.dot}`} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
