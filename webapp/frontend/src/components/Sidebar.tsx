import { NavLink } from 'react-router-dom'
import type { CrisisEvent } from '../api'

export type Role = 'citizen' | 'tourist' | 'responder' | 'government'

const NAV_ITEMS: Record<Role, { icon: string; label: string; sub: string; path: string }[]> = {
  citizen: [
    { icon: '⊞', label: 'Dashboard', sub: 'Overview and alerts', path: '/' },
    { icon: '△', label: 'Alerts', sub: 'Active Crisis Alerts', path: '/alerts' },
    { icon: '◎', label: 'Map', sub: 'Live Crisis Map', path: '/map' },
    { icon: '⊕', label: 'Resources', sub: 'Shelters, Hospitals, Helplines', path: '/resources' },
    { icon: '✦', label: 'Safety Tips', sub: 'Stay Safe, Stay Informed', path: '/safety-tips' },
    { icon: '⊡', label: 'Report', sub: 'Send a Report', path: '/report' },
    { icon: '⊙', label: 'Settings', sub: 'Preferences', path: '/settings' },
  ],
  tourist: [
    { icon: '⊞', label: 'Dashboard', sub: 'Overview & safety at a glance', path: '/' },
    { icon: '◎', label: 'Safety Map', sub: 'Real-time risk in Bali', path: '/map' },
    { icon: '△', label: 'Travel Alerts', sub: 'Current warnings', path: '/alerts' },
    { icon: '⊕', label: 'Places & Services', sub: 'Hospitals, shelters & more', path: '/places' },
    { icon: '✦', label: 'Itinerary Safety', sub: 'Check your travel plan', path: '/itinerary' },
    { icon: '☀', label: 'Travel Tips', sub: 'Stay safe, stay informed', path: '/tips' },
    { icon: '⊗', label: 'Emergency Help', sub: 'Contact & resources', path: '/emergency' },
    { icon: '⊙', label: 'Settings', sub: 'Preferences', path: '/settings' },
  ],
  responder: [
    { icon: '⊞', label: 'Dashboard', sub: 'Live overview', path: '/' },
    { icon: '△', label: 'Incidents', sub: 'Active & ongoing', path: '/incidents' },
    { icon: '⊙', label: 'Operations', sub: 'Teams & resources', path: '/operations' },
    { icon: '⊕', label: 'Resources', sub: 'Assets & availability', path: '/resources' },
    { icon: '✉', label: 'Communications', sub: 'Alerts & messages', path: '/communications' },
    { icon: '⊡', label: 'Reports', sub: 'Generate reports', path: '/reports' },
    { icon: '⊙', label: 'Settings', sub: 'Preferences', path: '/settings' },
  ],
  government: [
    { icon: '⊞', label: 'Dashboard', sub: 'Overview and key metrics', path: '/' },
    { icon: '◎', label: 'Crisis Map', sub: 'Geographic view of events', path: '/map' },
    { icon: '⊕', label: 'AI Assistant', sub: 'Role-based guidance', path: '/assistant' },
    { icon: '∿', label: 'Analytics', sub: 'Trends and insights', path: '/analytics' },
    { icon: '⊡', label: 'Command Center', sub: 'Strategic coordination', path: '/command-center' },
  ],
}

const ROLE_COLORS: Record<Role, string> = {
  citizen: 'bg-blue-600',
  tourist: 'bg-emerald-600',
  responder: 'bg-red-600',
  government: 'bg-indigo-600',
}

const FOOTER_TEXT: Record<Role, { title: string; subtitle: string }> = {
  citizen: { title: 'Stay Informed, Stay Safe', subtitle: 'Together We Are Stronger' },
  tourist: { title: 'Your Safety Our Priority', subtitle: 'Stay informed. Stay safe.' },
  responder: { title: 'Responder Mode', subtitle: 'For authorized personnel only' },
  government: { title: 'CrisisLens v2.0.1', subtitle: 'Real-time Crisis Intelligence' },
}

interface Props {
  role: Role
  darkMode: boolean
  events: CrisisEvent[]
}

export default function Sidebar({ role, darkMode, events }: Props) {
  const navItems = NAV_ITEMS[role]
  const footer = FOOTER_TEXT[role]
  const criticalCount = events.filter(e => e.severity === 'critical' || e.severity === 'high').length

  return (
    <aside className={`w-60 flex-shrink-0 flex flex-col border-r h-full ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto pt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
              isActive
                ? darkMode
                  ? 'bg-blue-900/40 text-blue-400'
                  : 'bg-blue-50 text-blue-700'
                : darkMode
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {({ isActive }) => (
              <>
                <span className={`text-lg w-6 text-center flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isActive ? '' : ''}`}>{item.label}</div>
                  <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.sub}</div>
                </div>
                {item.label === 'Alerts' && criticalCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {criticalCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer branding */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`flex items-center gap-3 p-3 rounded-xl ${
          role === 'responder'
            ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
            : darkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm ${ROLE_COLORS[role]}`}>
            {role === 'citizen' ? '🛡' : role === 'tourist' ? '🌴' : role === 'responder' ? '🚑' : '🏛'}
          </div>
          <div className="min-w-0">
            <div className={`text-xs font-semibold truncate ${
              role === 'responder' ? 'text-red-700' : darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>{footer.title}</div>
            <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{footer.subtitle}</div>
          </div>
        </div>
        {role === 'government' && (
          <div className="flex items-center gap-1.5 mt-2 px-1">
            <span className="w-2 h-2 rounded-full bg-green-500 live-dot"></span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active events</span>
          </div>
        )}
      </div>
    </aside>
  )
}
