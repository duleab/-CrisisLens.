import type { CrisisEvent, Stats } from '../api'
import KpiBar from '../components/KpiBar'
import CrisisMap from '../components/CrisisMap'
import AlertsList from '../components/AlertsList'

interface Props {
  events: CrisisEvent[]
  stats: Stats | null
  darkMode: boolean
}

const SAFETY_TIPS = [
  { icon: '✅', tip: 'Stay alert and follow official updates' },
  { icon: '🎒', tip: 'Keep your documents and valuables safe' },
  { icon: '📞', tip: 'Know emergency contacts and locations' },
]

const EMERGENCY_CONTACTS = [
  { name: 'Police Emergency', number: '110', icon: '👮' },
  { name: 'Ambulance', number: '118', icon: '🚑' },
  { name: 'Bali SAR Team', number: '+62 361 115', icon: '🆘' },
  { name: 'Tourist Helpline', number: '+62 361 511 000', icon: '📞' },
]

const NEARBY_SUPPORT = [
  { icon: '🏥', label: 'Hospitals', value: '24 within 20 km' },
  { icon: '🏠', label: 'Shelters', value: '8 open' },
  { icon: '🚔', label: 'Police Stations', value: '15 within 10 km' },
  { icon: 'ℹ️', label: 'Tourist Info Centers', value: '6 available' },
]

export default function TouristDashboard({ events, stats, darkMode }: Props) {
  const criticalCount = stats?.critical ?? events.filter(e => e.severity === 'critical').length
  const safetyScore = criticalCount === 0 ? 8 : criticalCount < 3 ? 6 : 4
  const safetyColor = safetyScore >= 7 ? 'text-green-500' : safetyScore >= 5 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          <select className={`text-sm px-3 py-1.5 rounded-lg border ${
            darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
          }`}>
            <option>📍 Bali, Indonesia</option>
            <option>📍 Jakarta, Indonesia</option>
            <option>📍 Lombok, Indonesia</option>
          </select>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>System Online</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 live-dot" />
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Auto-refresh ON</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* KPI row */}
        <KpiBar role="tourist" events={events} stats={stats} darkMode={darkMode} />

        {/* Map + right panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={`lg:col-span-2 rounded-2xl border overflow-hidden ${
            darkMode ? 'border-gray-700' : 'border-gray-200 shadow-sm'
          }`}>
            <div className={`px-4 py-2.5 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📍 Bali Safety Map
              </span>
            </div>
            <div style={{ height: '380px' }}>
              <CrisisMap events={events} darkMode={darkMode} />
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Travel Safety Score */}
            <div className={`rounded-2xl border p-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className={`flex items-center justify-between mb-3`}>
                <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🛡️ Travel Safety Score
                </span>
                <button className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>View Details</button>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${safetyColor}`}>{safetyScore}<span className="text-lg">/10</span></div>
                <div className="space-y-1">
                  <div className={`text-sm font-medium ${safetyColor}`}>
                    {safetyScore >= 7 ? 'Good' : safetyScore >= 5 ? 'Moderate Risk' : 'High Risk'}
                  </div>
                  {SAFETY_TIPS.slice(0, 2).map(t => (
                    <div key={t.tip} className={`text-xs flex items-start gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>{t.icon}</span><span>{t.tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <AlertsList events={events} darkMode={darkMode} maxItems={3} />

            {/* Emergency Contacts */}
            <div className={`rounded-2xl border p-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className={`font-semibold text-sm mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                📞 Emergency Contacts
              </div>
              <div className="space-y-2">
                {EMERGENCY_CONTACTS.map(c => (
                  <div key={c.name} className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span>{c.icon}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="font-semibold">{c.number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Nearby Support */}
          <div className={`rounded-2xl border p-4 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`font-semibold text-sm mb-3 flex items-center justify-between ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <span>🏥 Nearby Support</span>
              <button className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>View All</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NEARBY_SUPPORT.map(s => (
                <div key={s.label} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{s.label}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div className={`rounded-2xl border p-4 flex items-center gap-4 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="text-5xl">🌤️</div>
            <div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>28°C</div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Partly Cloudy</div>
              <div className={`text-xs mt-2 space-y-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div>💧 Humidity: 74%</div>
                <div>💨 Wind: 12 km/h</div>
                <div>☀️ UV Index: 6 (High)</div>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div className={`rounded-2xl border p-4 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className={`font-semibold text-sm mb-3 flex items-center justify-between ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <span>✅ Safety Tips</span>
              <button className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>View All</button>
            </div>
            <div className="space-y-2">
              {SAFETY_TIPS.map(t => (
                <div key={t.tip} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-green-50 text-gray-700'
                }`}>
                  <span>{t.icon}</span>
                  <span>{t.tip}</span>
                </div>
              ))}
              <div className={`text-xs text-center font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                🌴 Stay Safe and Enjoy Bali! 💚
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
