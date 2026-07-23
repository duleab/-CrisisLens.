import type { Role } from './Sidebar'

interface Action {
  label: string
  icon: string
  color: string
  onClick?: () => void
}

const ROLE_ACTIONS: Record<Role, Action[]> = {
  citizen: [
    { label: 'Report Emergency', icon: '📢', color: 'bg-red-600 hover:bg-red-700 text-white' },
    { label: 'Find Nearby Shelters', icon: '🏠', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Emergency Helplines', icon: '📞', color: 'bg-green-600 hover:bg-green-700 text-white' },
  ],
  tourist: [
    { label: 'Emergency: Call 112', icon: '📞', color: 'bg-red-600 hover:bg-red-700 text-white' },
    { label: 'Find Nearby Hospitals', icon: '🏥', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Travel Safety Tips', icon: '✅', color: 'bg-green-600 hover:bg-green-700 text-white' },
  ],
  responder: [
    { label: 'Send Alert', icon: '📡', color: 'bg-red-600 hover:bg-red-700 text-white' },
    { label: 'Request Resources', icon: '📦', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Contact Team', icon: '📞', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { label: 'Generate Report', icon: '📋', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  ],
  government: [
    { label: 'Activate Emergency Response', icon: '🚨', color: 'bg-red-600 hover:bg-red-700 text-white' },
    { label: 'Generate Situation Report', icon: '📋', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  ],
}

const EMERGENCY_NOTE: Record<Role, { icon: string; text: string; sub: string } | null> = {
  citizen: { icon: '📞', text: 'In an emergency? Call 112', sub: 'Your safety is our priority' },
  tourist: null,
  responder: null,
  government: null,
}

interface Props {
  role: Role
  darkMode: boolean
}

export default function QuickActions({ role, darkMode }: Props) {
  const actions = ROLE_ACTIONS[role]
  const note = EMERGENCY_NOTE[role]

  return (
    <div className={`rounded-2xl border p-4 ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      <div className={`flex items-center gap-2 mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <span className="text-sm">🛡️</span>
        <span className="font-semibold text-sm">Quick Actions</span>
      </div>

      <div className="space-y-2">
        {actions.map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${action.color}`}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {note && (
        <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl ${
          darkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <span className="text-lg">{note.icon}</span>
          <div>
            <div className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{note.text}</div>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{note.sub}</div>
          </div>
        </div>
      )}
    </div>
  )
}
