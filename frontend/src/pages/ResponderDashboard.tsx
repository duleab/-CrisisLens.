import type { CrisisEvent, Stats } from '../api'
import KpiBar from '../components/KpiBar'
import CrisisMap from '../components/CrisisMap'
import AlertsList from '../components/AlertsList'
import QuickActions from '../components/QuickActions'

interface Props {
  events: CrisisEvent[]
  stats: Stats | null
  darkMode: boolean
}

const RESOURCES = [
  { label: 'Rescue Teams', used: 3, total: 5, icon: '🚒' },
  { label: 'Boats', used: 4, total: 6, icon: '🚤' },
  { label: 'Helicopters', used: 1, total: 2, icon: '🚁' },
  { label: 'Ambulances', used: 6, total: 10, icon: '🚑' },
  { label: 'Hospitals', total: 7, icon: '🏥' },
  { label: 'Shelters', used: 3, total: 8, icon: '🏠' },
]

const TIMELINE_ICONS: Record<string, string> = {
  earthquake: '🔴', disease: '🦠', other: '🟡', flood: '💧',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (isNaN(mins) || mins < 0) return ''
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

export default function ResponderDashboard({ events, stats, darkMode }: Props) {
  const topEvents = [...events]
    .sort((a, b) => {
      const s = { critical: 0, high: 1, medium: 2, low: 3 }
      return (s[a.severity as keyof typeof s] ?? 4) - (s[b.severity as keyof typeof s] ?? 4)
    })
    .slice(0, 6)

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🚑 Emergency Response Overview
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Real-time situational awareness for emergency response teams
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Auto-refresh ON</span>
          </div>
          <select className={`text-sm px-3 py-1.5 rounded-lg border ${
            darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <option>📅 Last 24 Hours</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        <KpiBar role="responder" events={events} stats={stats} darkMode={darkMode} />

        {/* Map */}
        <div className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'border-gray-700' : 'border-gray-200 shadow-sm'
        }`}>
          <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              📍 Live Incident Map
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 live-dot" />
              <span className={`text-xs font-medium text-red-500`}>LIVE</span>
            </div>
          </div>
          <div style={{ height: '380px' }}>
            <CrisisMap events={events} darkMode={darkMode} />
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Alerts */}
          <AlertsList events={events} darkMode={darkMode} maxItems={4} />

          {/* Resources */}
          <div className={`rounded-2xl border p-4 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex items-center gap-2">
                <span>📦</span>
                <span className="font-semibold text-sm">Available Resources</span>
              </div>
              <button className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>View All</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {RESOURCES.map(r => (
                <div key={r.label} className={`p-2.5 rounded-xl text-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="text-2xl mb-1">{r.icon}</div>
                  <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {r.used !== undefined ? `${r.used} / ${r.total}` : r.total}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{r.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions + response timeline */}
          <div className="space-y-4">
            <QuickActions role="responder" darkMode={darkMode} />
            <div className={`rounded-2xl border p-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between mb-3`}>
                <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ⏱️ Response Timeline
                </span>
                <button className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>View All</button>
              </div>
              <div className="space-y-2">
                {topEvents.slice(0, 4).map(e => (
                  <div key={e.id} className={`flex items-start gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="flex-shrink-0">{TIMELINE_ICONS[e.crisis_type] || '⚠️'}</span>
                    <span className="flex-1 truncate">
                      {e.crisis_type.charAt(0).toUpperCase() + e.crisis_type.slice(1)} — {e.location_name || e.country_iso || 'Unknown'}
                    </span>
                    <span className="flex-shrink-0 text-gray-400">{timeAgo(e.event_date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
