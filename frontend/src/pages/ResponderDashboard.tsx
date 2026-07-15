import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { dashboardApi, crisisApi } from '../lib/api'
import { formatRelativeTime, getSeverityColor, getCrisisTypeIcon, getCountryFlag } from '../lib/utils'
import CrisisMap from '../components/CrisisMap'
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  MapPin, 
  Radio,
  Truck,
  Activity,
  Clock,
  Target,
  Zap
} from 'lucide-react'

const ResponderDashboard: React.FC = () => {
  const { setCrisisEvents, setDashboardStats } = useAppStore()

  // Fetch dashboard summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', 'responder'],
    queryFn: () => dashboardApi.getSummary('responder'),
    refetchInterval: 30000, // More frequent updates for responders
  })

  // Fetch high priority events
  const { data: eventsData } = useQuery({
    queryKey: ['crisis-events-responder'],
    queryFn: () => crisisApi.getEvents({
      hours_back: 24,
      limit: 50,
      min_confidence: 0.6 // Only higher confidence events
    }),
    refetchInterval: 15000, // Very frequent updates
  })

  // Fetch alerts
  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts', 'responder'],
    queryFn: () => dashboardApi.getAlerts('responder'),
    refetchInterval: 15000,
  })

  // Update store when data changes
  useEffect(() => {
    if (eventsData?.data.events) {
      setCrisisEvents(eventsData.data.events)
    }
    if (summary?.data.statistics) {
      setDashboardStats(summary.data.statistics)
    }
  }, [eventsData, summary, setCrisisEvents, setDashboardStats])

  const stats = summary?.data.statistics
  const events = eventsData?.data.events || []
  const aiSummary = summary?.data.ai_summary
  const alertsList = alerts?.data.alerts || []

  // Categorize events by priority
  const criticalEvents = events.filter(e => e.severity === 'critical')
  const highPriorityEvents = events.filter(e => e.severity === 'high')
  const activeOperations = events.filter(e => e.severity === 'critical' || e.severity === 'high')

  const getOperationalPriority = (event: any) => {
    if (event.severity === 'critical' && event.official_confirmed) return 'P1 - IMMEDIATE'
    if (event.severity === 'critical') return 'P2 - URGENT'  
    if (event.severity === 'high' && event.official_confirmed) return 'P2 - URGENT'
    if (event.severity === 'high') return 'P3 - HIGH'
    return 'P4 - MONITOR'
  }

  const getPriorityColor = (priority: string) => {
    if (priority.includes('P1')) return 'bg-red-600 text-white'
    if (priority.includes('P2')) return 'bg-orange-500 text-white'  
    if (priority.includes('P3')) return 'bg-yellow-500 text-black'
    return 'bg-blue-500 text-white'
  }

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading operational intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span>🚑</span>
            <span>Emergency Response Command</span>
          </h1>
          <p className="text-gray-600 mt-1">Tactical operations and resource coordination dashboard</p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">Live Updates</span>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalEvents.length > 0 && (
        <div className="bg-red-600 text-white rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">🚨 CRITICAL INCIDENTS ACTIVE</h3>
              <p className="text-red-100">
                {criticalEvents.length} critical event{criticalEvents.length > 1 ? 's' : ''} requiring immediate response
              </p>
            </div>
            <button className="px-4 py-2 bg-white text-red-600 rounded font-medium hover:bg-red-50">
              Deploy Teams
            </button>
          </div>
        </div>
      )}

      {/* AI Tactical Assessment */}
      {aiSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Operational Assessment</h3>
              <p className="text-blue-800 text-sm leading-relaxed">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Incidents</p>
              <p className="text-2xl font-bold text-red-600">{activeOperations.length}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Requiring response</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical (P1)</p>
              <p className="text-2xl font-bold text-red-600">{criticalEvents.length}</p>
            </div>
            <Target className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Immediate action</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">{highPriorityEvents.length}</p>
            </div>
            <Radio className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Urgent response</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats?.verified || 0}</p>
            </div>
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Confirmed events</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Operations List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tactical Map */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Tactical Overview</span>
              </h3>
            </div>
            <div className="p-4">
              <CrisisMap height="400px" />
            </div>
          </div>

          {/* Active Operations */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Active Operations</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {events
                .sort((a, b) => {
                  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                  return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                         (severityOrder[a.severity as keyof typeof severityOrder] || 0)
                })
                .slice(0, 10)
                .map((event, index) => {
                  const priority = getOperationalPriority(event)
                  return (
                    <div key={event.id || index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <span className="text-2xl">{getCrisisTypeIcon(event.crisis_type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900 capitalize">
                                {event.crisis_type}
                              </h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(priority)}`}>
                                {priority}
                              </span>
                              {event.official_confirmed && (
                                <span className="text-green-600 text-xs">✅ CONFIRMED</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span className="font-medium">{event.location_name}</span>
                                {event.country_iso && (
                                  <span>{getCountryFlag(event.country_iso)}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4">
                                <span>📊 {Math.round(event.confidence * 100)}% confidence</span>
                                <span>📰 {event.source_name}</span>
                                <span>🕒 {formatRelativeTime(event.created_at)}</span>
                              </div>
                              
                              {/* Tactical recommendations */}
                              {(event.severity === 'critical' || event.severity === 'high') && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                  <strong>Action Required:</strong> {
                                    event.crisis_type === 'earthquake' ? 'Deploy search & rescue teams. Set up medical triage.' :
                                    event.crisis_type === 'flood' ? 'Evacuate flood zones. Deploy water rescue units.' :
                                    event.crisis_type === 'wildfire' ? 'Coordinate evacuation. Deploy fire suppression resources.' :
                                    'Assess situation and deploy appropriate response teams.'
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1 ml-3">
                          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                            Deploy
                          </button>
                          <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              
              {events.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active operations</p>
                  <p className="text-xs mt-1">All systems monitoring</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Deploy */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>Quick Deploy</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                🚑 Medical Response Team
              </button>
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                🔥 Fire & Rescue Unit
              </button>
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                👮 Police Support
              </button>
              <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                🚁 Air Support
              </button>
              <button className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                🛠️ Technical Rescue
              </button>
            </div>
          </div>

          {/* Resource Status */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Resource Status</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">🚑 Ambulances</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">12 Available</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">🔥 Fire Trucks</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">8 Available</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">👮 Police Units</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-600 font-medium">5 Available</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">🚁 Helicopters</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 font-medium">1 Available</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">👥 Personnel</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">94 On Duty</span>
                </div>
              </div>
            </div>
          </div>

          {/* Communication Hub */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Radio className="w-5 h-5" />
                <span>Communications</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                📡 Emergency Broadcast
              </button>
              <button className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium">
                📞 Command Center
              </button>
              <button className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium">
                📱 Field Teams
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>System Status</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Command Center</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Communications</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">GPS Tracking</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Sync</span>
                <span className="text-gray-900 font-medium">15 sec ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponderDashboard