import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { 
  LayoutDashboard, 
  Map, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  Users,
  Plane,
  Building2
} from 'lucide-react'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { userRole, crisisEvents } = useAppStore()

  // Role-specific navigation items
  const getNavItems = () => {
    const baseItems = [
      {
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: `/dashboard/${userRole}`,
        description: 'Overview and key metrics'
      },
      {
        icon: Map,
        label: 'Crisis Map',
        path: `/dashboard/${userRole}#map`,
        description: 'Geographic view of events'
      },
      {
        icon: MessageSquare,
        label: 'AI Assistant',
        path: `/dashboard/${userRole}#chat`,
        description: 'Role-based guidance'
      },
      {
        icon: BarChart3,
        label: 'Analytics',
        path: `/dashboard/${userRole}#analytics`,
        description: 'Trends and insights'
      }
    ]

    // Add role-specific items
    switch (userRole) {
      case 'government':
        return [
          ...baseItems,
          {
            icon: Building2,
            label: 'Command Center',
            path: `/dashboard/${userRole}#command`,
            description: 'Strategic coordination'
          }
        ]
      
      case 'responder':
        return [
          ...baseItems,
          {
            icon: Shield,
            label: 'Operations',
            path: `/dashboard/${userRole}#operations`,
            description: 'Tactical management'
          }
        ]
      
      case 'citizen':
        return [
          ...baseItems,
          {
            icon: Users,
            label: 'Community',
            path: `/dashboard/${userRole}#community`,
            description: 'Local information'
          }
        ]
      
      case 'tourist':
        return [
          ...baseItems,
          {
            icon: Plane,
            label: 'Travel Safety',
            path: `/dashboard/${userRole}#travel`,
            description: 'Destination guidance'
          }
        ]
      
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()
  const criticalEvents = crisisEvents.filter(e => e.severity === 'critical').length

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Crisis status indicator */}
        {criticalEvents > 0 && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {criticalEvents} Critical Alert{criticalEvents > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path.includes('#') && location.hash === item.path.split('#')[1])
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div>CrisisLens v2.0</div>
            <div>Real-time Crisis Intelligence</div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                crisisEvents.length > 0 ? 'bg-green-400' : 'bg-gray-400'
              }`}></div>
              <span>
                {crisisEvents.length} active event{crisisEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar