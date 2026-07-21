import React from 'react'
import type { CrisisEvent } from '../api'
import { SEVERITY_STYLE, CRISIS_ICON, DEFAULT_ICON, getSeverityStyle, getCrisisIcon } from '../constants'

const SEV_BADGE: Record<string, string> = {
  critical: 'text-red-700 bg-red-100 border border-red-300',
  high:     'text-orange-700 bg-orange-100 border border-orange-300',
  medium:   'text-yellow-700 bg-yellow-100 border border-yellow-300',
  low:      'text-green-700 bg-green-100 border border-green-300',
  info:     'text-blue-700 bg-blue-100 border border-blue-300',
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
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
      const aSev = (a.severity || '').toLowerCase() as keyof typeof sevOrder
      const bSev = (b.severity || '').toLowerCase() as keyof typeof sevOrder
      return (sevOrder[aSev] ?? 5) - (sevOrder[bSev] ?? 5)
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
            const sev = getSeverityStyle(e.severity)
            const IconComp = getCrisisIcon(e.crisis_type)
            const badgeClass = SEV_BADGE[(e.severity || '').toLowerCase()] || SEV_BADGE.low

            return (
              <div key={e.id} className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              } slide-in-right`}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                  style={{ backgroundColor: sev.color }}
                >
                  <IconComp size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-2 flex-wrap`}>
                    <span className={`text-xs font-semibold uppercase ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {e.crisis_type}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeClass}`}>
                      {sev.label}
                    </span>
                  </div>
                  <div className={`text-xs truncate mt-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {e.location_name || e.country_iso || 'Unknown location'}
                  </div>
                  <div className={`text-xs mt-0.5 flex gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>🎯 {(e.system_confidence * 100).toFixed(0)}%</span>
                    {e.event_date && <span>• {timeAgo(e.event_date)}</span>}
                    {e.official_confirmed && <span className="text-green-500 font-semibold">• Verified</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
