import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { dashboardApi, crisisApi } from '../lib/api'
import { formatRelativeTime, getSeverityColor, getCrisisTypeIcon, getCountryFlag } from '../lib/utils'
import CrisisMap from '../components/CrisisMap'
import { 
  Plane, 
  AlertTriangle, 
  MapPin, 
  Globe,
  Phone,
  Shield,
  Navigation,
  Briefcase,
  Zap,
  Info
} from 'lucide-react'

const TouristDashboard: React.FC = () => {
  const { setCrisisEvents, setDashboardStats, userLocation } = useAppStore()

  // Fetch dashboard summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', 'tourist'],
    queryFn: () => dashboardApi.getSummary('tourist'),
    refetchInterval: 60000,
  })

  // Fetch travel-relevant events
  const { data: eventsData } = useQuery({
    queryKey: ['crisis-events-tourist'],
    queryFn: () => crisisApi.getEvents({
      hours_back: 72, // Longer timeframe for travel planning
      limit: 30
    }),
    refetchInterval: 60000,
  })

  // Fetch travel alerts
  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts', 'tourist'],
    queryFn: () => dashboardApi.getAlerts('tourist'),
    refetchInterval: 60000,
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

  // Filter events by travel relevance
  const travelAlerts = events.filter(e => e.severity === 'high' || e.severity === 'critical')
  const destinationEvents = events.filter(e => e.country_iso === 'ID' || e.country_iso === 'PH' || e.country_iso === 'MY')

  // Travel safety recommendations
  const getTravelAdvice = () => {
    const advice = []
    
    if (travelAlerts.length > 0) {
      advice.push("🚨 Check current travel advisories before departure")
    }
    
    if (events.some(e => e.crisis_type === 'earthquake')) {
      advice.push("🌍 Southeast Asia seismic activity - review hotel safety")
    }
    
    if (events.some(e => e.crisis_type === 'flood')) {
      advice.push("🌊 Monsoon season impacts - avoid flood-prone areas")
    }
    
    if (events.some(e => e.crisis_type === 'volcano')) {
      advice.push("🌋 Volcanic activity - check flight disruptions")
    }

    return advice.length > 0 ? advice : [
      "✅ Current conditions suitable for travel",
      "📱 Keep emergency contacts handy",
      "🏥 Verify travel insurance coverage"
    ]
  }

  // Embassy contacts for popular destinations
  const embassyContacts = [
    { country: "🇮🇩 Indonesia", phone: "+62-21-3142-9000", city: "Jakarta" },
    { country: "🇵🇭 Philippines", phone: "+63-2-301-2000", city: "Manila" },
    { country: "🇲🇾 Malaysia", phone: "+60-3-2168-5000", city: "Kuala Lumpur" },
    { country: "🇹🇭 Thailand", phone: "+66-2-120-8000", city: "Bangkok" },
    { country: "🇸🇬 Singapore", phone: "+65-6476-9100", city: "Singapore" }
  ]

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading travel intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2 mb-2">
          <span>✈️</span>
          <span>Travel Safety Intelligence</span>
        </h1>
        <p className="text-gray-600">Stay informed about destination conditions and travel safety</p>
        {userLocation && (
          <p className="text-sm text-green-600 mt-1 flex items-center justify-center space-x-1">
            <Navigation className="w-4 h-4" />
            <span>Planning from: {userLocation}</span>
          </p>
        )}
      </div>

      {/* Travel Alerts */}
      {travelAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">⚠️ Travel Advisory</h3>
              {travelAlerts.slice(0, 2).map((alert, index) => (
                <div key={index} className="text-orange-800 text-sm mb-2">
                  <strong>{alert.crisis_type} in {alert.location_name}</strong> - Exercise caution when traveling to this area
                </div>
              ))}
              <p className="text-orange-700 text-sm font-medium">
                📞 Contact your embassy for latest guidance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Travel Guidance */}
      {aiSummary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-green-900 mb-1">Travel Safety Guidance</h3>
              <p className="text-green-800 text-sm leading-relaxed">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Travel Status Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Incidents</p>
              <p className="text-2xl font-bold text-orange-600">{travelAlerts.length}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">May affect travel</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Destinations</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.countries_affected || 0}</p>
            </div>
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">With reported events</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified Events</p>
              <p className="text-2xl font-bold text-green-600">{stats?.verified || 0}</p>
            </div>
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Officially confirmed</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Safe Regions</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.max(0, 10 - (stats?.countries_affected || 0))}
              </p>
            </div>
            <Plane className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Clear for travel</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Travel Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Destination Map */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Destination Safety Overview</span>
              </h3>
            </div>
            <div className="p-4">
              <CrisisMap height="350px" />
            </div>
          </div>

          {/* Destination Updates */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Travel Conditions by Destination</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {events.slice(0, 8).map((event, index) => (
                <div key={event.id || index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0">{getCrisisTypeIcon(event.crisis_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {event.crisis_type} - {event.location_name}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                          {event.severity.toUpperCase()}
                        </span>
                        {event.country_iso && (
                          <span className="text-lg">{getCountryFlag(event.country_iso)}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span>📊 {Math.round(event.confidence * 100)}% confidence</span>
                          <span>📰 {event.source_name}</span>
                          <span>🕒 {formatRelativeTime(event.created_at)}</span>
                        </div>
                      </div>
                      
                      {/* Travel-specific guidance */}
                      {event.severity === 'high' || event.severity === 'critical' ? (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                          <strong>Travel Impact:</strong> {
                            event.crisis_type === 'earthquake' ? 'Airport delays possible. Check hotel structural safety.' :
                            event.crisis_type === 'flood' ? 'Transportation disruptions likely. Avoid low-lying areas.' :
                            event.crisis_type === 'volcano' ? 'Flight cancellations expected. Monitor air quality.' :
                            event.crisis_type === 'storm' ? 'Outdoor activities not recommended. Stay indoors.' :
                            'Monitor local news and follow official guidance. Consider travel insurance.'
                          }
                        </div>
                      ) : (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                          <strong>Travel Status:</strong> Normal precautions advised. Monitor for updates.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {events.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No travel-affecting events detected</p>
                  <p className="text-xs mt-1">Current conditions favorable for travel</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Travel Status */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Overall Travel Status</span>
              </h3>
            </div>
            <div className="p-4 text-center">
              {travelAlerts.length > 2 ? (
                <div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-600">High Caution</p>
                  <p className="text-xs text-gray-600 mt-1">Multiple incidents reported</p>
                </div>
              ) : travelAlerts.length > 0 ? (
                <div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-sm font-medium text-yellow-600">Exercise Caution</p>
                  <p className="text-xs text-gray-600 mt-1">Monitor conditions</p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-green-600">Normal Conditions</p>
                  <p className="text-xs text-gray-600 mt-1">Safe to travel with standard precautions</p>
                </div>
              )}
            </div>
          </div>

          {/* Embassy Contacts */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Embassy Contacts</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {embassyContacts.map((embassy, index) => (
                <div key={index} className="border-b border-gray-100 pb-2 last:border-b-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{embassy.country}</span>
                    <span className="text-xs text-gray-500">{embassy.city}</span>
                  </div>
                  <a
                    href={`tel:${embassy.phone}`}
                    className="text-xs font-mono text-blue-600 hover:text-blue-700"
                  >
                    {embassy.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Tips */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Travel Safety Tips</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {getTravelAdvice().map((tip, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Navigation className="w-5 h-5" />
                <span>Travel Tools</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                🗺️ Route Safety Check
              </button>
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                🏥 Find Hospitals
              </button>
              <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                📱 Download Offline Maps
              </button>
              <button className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                💼 Travel Insurance
              </button>
            </div>
          </div>

          {/* Popular Destinations */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Destination Status</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <span>🇮🇩</span>
                  <span>Indonesia</span>
                </span>
                <span className="text-green-600 font-medium">✅ Safe</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <span>🇵🇭</span>
                  <span>Philippines</span>
                </span>
                <span className="text-yellow-600 font-medium">⚠️ Monitor</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <span>🇲🇾</span>
                  <span>Malaysia</span>
                </span>
                <span className="text-green-600 font-medium">✅ Safe</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <span>🇹🇭</span>
                  <span>Thailand</span>
                </span>
                <span className="text-green-600 font-medium">✅ Safe</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <span>🇸🇬</span>
                  <span>Singapore</span>
                </span>
                <span className="text-green-600 font-medium">✅ Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TouristDashboard