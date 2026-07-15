import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { dashboardApi, crisisApi } from '../lib/api'
import { formatDateTime, formatRelativeTime, getSeverityColor, getCrisisTypeIcon, getCountryFlag } from '../lib/utils'
import CrisisMap from '../components/CrisisMap'
import { 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Users, 
  MapPin, 
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const GovernmentDashboard: React.FC = () => {
  const { setCrisisEvents, setDashboardStats } = useAppStore()
  const [selectedTimeframe, setSelectedTimeframe] = useState('24')

  // Fetch dashboard summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', 'government'],
    queryFn: () => dashboardApi.getSummary('government'),
    refetchInterval: 60000, // Refresh every minute
  })

  // Fetch crisis events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['crisis-events', selectedTimeframe],
    queryFn: () => crisisApi.getEvents({
      hours_back: parseInt(selectedTimeframe),
      limit: 50
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => dashboardApi.getAnalytics(7),
    refetchInterval: 300000, // Refresh every 5 minutes
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

  // Chart data
  const severityData = Object.entries(summary?.data.crisis_types || {}).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count
  }))

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6']

  if (summaryLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading government intelligence...</p>
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
            <span>🏛️</span>
            <span>Government Command Center</span>
          </h1>
          <p className="text-gray-600 mt-1">Strategic crisis intelligence and coordination dashboard</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="6">Last 6 hours</option>
            <option value="24">Last 24 hours</option>
            <option value="72">Last 3 days</option>
            <option value="168">Last week</option>
          </select>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">AI Strategic Assessment</h3>
              <p className="text-blue-800 text-sm leading-relaxed">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_events || 0}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Last {selectedTimeframe} hours</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Events</p>
              <p className="text-2xl font-bold text-red-600">{stats?.critical_events || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Requiring immediate action</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified Events</p>
              <p className="text-2xl font-bold text-green-600">{stats?.verified || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Officially confirmed</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Countries Affected</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.countries_affected || 0}</p>
            </div>
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Coordination needed</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Crisis Events List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Crisis Map */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Geographic Overview</span>
              </h3>
            </div>
            <div className="p-4">
              <CrisisMap height="400px" />
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Crisis Events</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {events.slice(0, 10).map((event, index) => (
                <div key={event.id || index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-2xl">{getCrisisTypeIcon(event.crisis_type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {event.crisis_type}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </span>
                          {event.official_confirmed && (
                            <span className="text-green-600 text-xs">✅ Verified</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location_name}</span>
                            {event.country_iso && (
                              <span>{getCountryFlag(event.country_iso)}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span>📊 {Math.round(event.confidence * 100)}% confidence</span>
                            <span>📰 {event.source_name}</span>
                            <span>🕒 {formatRelativeTime(event.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {events.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No crisis events detected in the selected timeframe</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Crisis Types Distribution */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Crisis Types</span>
              </h3>
            </div>
            <div className="p-4">
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Quick Actions</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                🚨 Activate Emergency Response
              </button>
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                📊 Generate Situation Report
              </button>
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                🤝 Coordinate Resources
              </button>
              <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                📢 Public Communication
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
                <span className="text-gray-600">Data Collection</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">AI Processing</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Alert System</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Ready</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Update</span>
                <span className="text-gray-900 font-medium">
                  {formatRelativeTime(new Date().toISOString())}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GovernmentDashboard