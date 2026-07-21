import type { CrisisEvent, Stats } from '../api'
import KpiBar from '../components/KpiBar'
import CrisisMap from '../components/CrisisMap'
import CrisisSummary from '../components/CrisisSummary'
import QuickActions from '../components/QuickActions'

interface Props {
  events: CrisisEvent[]
  stats: Stats | null
  darkMode: boolean
}

// Simple donut chart using SVG
function DonutChart({ data, total, darkMode }: { data: Record<string, number>; total: number; darkMode: boolean }) {
  const colors = ['#ef4444', '#8b5cf6', '#f59e0b', '#6b7280', '#f97316', '#22c55e']
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  if (total === 0) return null

  let acc = 0
  const segments = entries.map(([type, count], i) => {
    const start = acc
    acc += count / total
    return { type, count, start, end: acc, color: colors[i % colors.length] }
  })

  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 56

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        {segments.map(seg => (
          <circle
            key={seg.type}
            cx={cx} cy={cy} r={r}
            fill="transparent"
            stroke={seg.color}
            strokeWidth="24"
            strokeDasharray={`${(seg.end - seg.start) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
            strokeDashoffset={`${-seg.start * 2 * Math.PI * r}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <circle cx={cx} cy={cy} r={r - 16} fill={darkMode ? '#1f2937' : 'white'} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="bold" fill={darkMode ? '#fff' : '#111'}>
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill={darkMode ? '#9ca3af' : '#666'}>Total</text>
      </svg>
      <div className="space-y-1">
        {segments.map(seg => (
          <div key={seg.type} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              {seg.count} {seg.type.charAt(0).toUpperCase() + seg.type.slice(1)} ({total > 0 ? Math.round(seg.count / total * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GovernmentDashboard({ events, stats, darkMode, region = 'sea' }: Props) {
  const byType: Record<string, number> = {}
  if (stats?.by_type) {
    Object.assign(byType, stats.by_type)
  } else {
    events.forEach(e => { byType[e.crisis_type] = (byType[e.crisis_type] || 0) + 1 })
  }
  const total = stats?.total ?? events.length

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            🏛️ Government Command Center
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Strategic crisis intelligence and coordination dashboard
          </p>
        </div>
        <select className={`text-sm px-3 py-1.5 rounded-lg border ${
          darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
        }`}>
          <option>📅 Last 24 hours</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        <KpiBar role="government" events={events} stats={stats} darkMode={darkMode} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Map */}
          <div className={`lg:col-span-2 rounded-2xl border overflow-hidden ${
            darkMode ? 'border-gray-700' : 'border-gray-200 shadow-sm'
          }`}>
            <div className={`px-4 py-2.5 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📍 Geographic Overview
              </span>
            </div>
            <div style={{ height: '450px' }}>
              <CrisisMap events={events} darkMode={darkMode} region={region} />
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Donut chart */}
            <div className={`rounded-2xl border p-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className={`flex items-center gap-2 mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <span>📊</span>
                <span className="font-semibold text-sm">Crisis Types</span>
              </div>
              <DonutChart data={byType} total={total} darkMode={darkMode} />
            </div>
            <QuickActions role="government" darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  )
}
