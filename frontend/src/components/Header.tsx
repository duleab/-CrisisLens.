import type { Role } from './Sidebar'

const ROLE_TITLES: Record<Role, string> = {
  citizen: 'Citizen Dashboard',
  tourist: 'Tourist Safety Dashboard',
  responder: 'Emergency Responder Dashboard',
  government: 'Government Dashboard',
}

const ROLE_SUBTITLES: Record<Role, string> = {
  citizen: '',
  tourist: '',
  responder: 'Real-time situational awareness for emergency response teams',
  government: 'Strategic crisis intelligence and coordination dashboard',
}

const ROLE_BADGE: Record<Role, { label: string; color: string } | null> = {
  citizen: null,
  tourist: null,
  responder: { label: '🚨 Emergency Mode', color: 'bg-red-600 hover:bg-red-700' },
  government: { label: 'GOVERNMENT', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
}

interface Props {
  role: Role
  darkMode: boolean
  onToggleDark: () => void
  onRoleChange: (r: Role) => void
  lastUpdated: Date | null
  systemOnline: boolean
  notifCount: number
  onRefresh: () => void
  loading: boolean
}

const ROLES: Role[] = ['citizen', 'tourist', 'responder', 'government']
const ROLE_ICONS: Record<Role, string> = {
  citizen: '👥', tourist: '✈️', responder: '🚑', government: '🏛️'
}

export default function Header({
  role, darkMode, onToggleDark, onRoleChange,
  lastUpdated, systemOnline, notifCount, onRefresh, loading,
}: Props) {
  const badge = ROLE_BADGE[role]
  const subtitle = ROLE_SUBTITLES[role]

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header className={`flex-shrink-0 border-b px-5 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Top row */}
      <div className="flex items-center justify-between h-14">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📡</span>
            </div>
            <div>
              <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>CrisisLens</span>
              <span className="text-red-500 font-bold text-sm"> AI 2.0</span>
            </div>
          </div>
          <div className={`h-5 w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          <div>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {ROLE_TITLES[role]}
            </span>
            {subtitle && (
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</div>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* System status */}
          <div className="hidden md:flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full live-dot ${systemOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {systemOnline ? 'System Online' : 'Disconnected'}
            </span>
          </div>

          {/* Location */}
          <div className={`hidden md:flex items-center gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <span>📍</span>
            <span>Indonesia</span>
          </div>

          {/* Date */}
          {lastUpdated && (
            <div className={`hidden lg:flex items-center gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>📅</span>
              <span>{fmtDate(lastUpdated)}</span>
            </div>
          )}

          {/* Auto-refresh indicator */}
          {lastUpdated && (
            <div className={`hidden md:flex items-center gap-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>🔄</span>
              <span>Updated {fmtTime(lastUpdated)}</span>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            } ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {loading ? '⏳' : '🔄'} {loading ? 'Loading...' : 'Refresh'}
          </button>

          {/* Notification bell */}
          <button className="relative p-1.5">
            <span className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🔔</span>
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {Math.min(notifCount, 9)}
              </span>
            )}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className={`p-1.5 rounded-lg transition-all ${
              darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Government badge */}
          {badge && (
            <span className={`text-xs font-bold px-3 py-1 rounded-lg ${badge.color} text-white`}>
              {badge.label}
            </span>
          )}

          {/* Role switcher */}
          <div className="relative group">
            <button className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs">
                {ROLE_ICONS[role]}
              </div>
              <span>Welcome, {role.charAt(0).toUpperCase() + role.slice(1)}</span>
              <span className="text-xs opacity-60">▾</span>
            </button>
            {/* Dropdown */}
            <div className={`absolute right-0 top-full mt-1 w-44 rounded-xl shadow-lg border z-50 overflow-hidden hidden group-hover:block ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-all ${
                    r === role
                      ? darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-700'
                      : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{ROLE_ICONS[r]}</span>
                  <span className="capitalize font-medium">{r}</span>
                  {r === role && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
