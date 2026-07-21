import type { CrisisEvent, Stats } from '../api'
import KpiBar from '../components/KpiBar'
import CrisisMap from '../components/CrisisMap'
import ChatPanel from '../components/ChatPanel'
import CrisisSummary from '../components/CrisisSummary'
import QuickActions from '../components/QuickActions'
import AlertsList from '../components/AlertsList'

interface Props {
  events: CrisisEvent[]
  stats: Stats | null
  darkMode: boolean
  loading: boolean
  onIngest: () => void
  region?: 'sea' | 'world'
}

export default function CitizenDashboard({ events, stats, darkMode, loading, onIngest, region = 'sea' }: Props) {
  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Page title */}
      <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            👥 Stay Informed, Stay Safe
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Real-time updates and guidance on crisis situations across Indonesia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${
            darkMode ? 'bg-green-900/40 text-green-400 border border-green-700' : 'bg-green-100 text-green-800'
          }`}>
            ✅ Active Monitoring
          </span>
          <select className={`text-sm px-3 py-1.5 rounded-lg border ${
            darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <option>📅 Last 24 Hours</option>
            <option>📅 Last 7 Days</option>
            <option>📅 Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* KPI row */}
        <KpiBar role="citizen" events={events} stats={stats} darkMode={darkMode} />

        {/* Map + right panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ minHeight: '500px' }}>
          {/* Map */}
          <div className={`lg:col-span-2 rounded-2xl border overflow-hidden ${
            darkMode ? 'border-gray-700' : 'border-gray-200 shadow-sm'
          }`}>
            <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
              <span>📍</span>
              <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Live Crisis Map
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Live</span>
              </div>
            </div>
            <div style={{ height: '450px' }}>
              <CrisisMap events={events} darkMode={darkMode} region={region} />
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            <CrisisSummary events={events} stats={stats} darkMode={darkMode} />
            <QuickActions role="citizen" darkMode={darkMode} />
          </div>
        </div>

        {/* Alerts list */}
        <AlertsList events={events} darkMode={darkMode} maxItems={5} />
      </div>
    </div>
  )
}
