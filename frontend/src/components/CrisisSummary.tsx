import type { CrisisEvent, Stats } from '../api'

const TYPE_ICONS: Record<string, string> = {
  earthquake: '🔴', flood: '💧', volcano: '🌋', wildfire: '🔥',
  landslide: '⛰️', storm: '🌀', disease: '🦠', tsunami: '🌊', other: '⚠️',
}

const ALL_TYPES = ['earthquake', 'flood', 'disease', 'other', 'volcano', 'wildfire', 'landslide', 'storm', 'tsunami']

interface Props {
  events: CrisisEvent[]
  stats: Stats | null
  darkMode: boolean
}

export default function CrisisSummary({ events, stats, darkMode }: Props) {
  const byType: Record<string, number> = {}
  if (stats?.by_type) {
    Object.assign(byType, stats.by_type)
  } else {
    events.forEach(e => {
      const t = e.crisis_type || 'other'
      byType[t] = (byType[t] || 0) + 1
    })
  }

  const total = Object.values(byType).reduce((a, b) => a + b, 0)

  return (
    <div className={`rounded-2xl border p-4 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className={`flex items-center gap-2 mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <span className="text-sm">📊</span>
        <span className="font-semibold text-sm">Crisis Summary</span>
      </div>

      <div className="space-y-1.5">
        {ALL_TYPES.map(type => {
          const count = byType[type] || 0
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="text-base w-6">{TYPE_ICONS[type]}</span>
              <span className={`text-sm flex-1 capitalize ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {type}
              </span>
              {count > 0 && (
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              <span className={`text-sm font-semibold w-5 text-right ${
                count > 0
                  ? darkMode ? 'text-white' : 'text-gray-900'
                  : darkMode ? 'text-gray-600' : 'text-gray-300'
              }`}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
