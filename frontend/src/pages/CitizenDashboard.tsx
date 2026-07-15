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
  Phone,
  Navigation,
  Heart,
  Home,
  Zap,
  Info
} from 'lucide-react'

const CitizenDashboard: React.FC = () => {
  const { setCrisisEvents, setDashboardStats, userLocation } = useAppStore()

  // Fetch dashboard summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', 'citizen'],
    queryFn: () => dashboardApi.getSummary('citizen'),
    refetchInterval: 60000,
  })

  // Fetch nearby events if location is available
  const { data: nearbyEvents } = useQuery({
    queryKey: ['nearby-events', userLocation],
    queryFn: () => {
      if (userLocation) {
        // Simple geocoding fallback - in real app would use proper geocoding
        return crisisApi.getNearbyEvents(-6.2088, 106.8456, 200) // Jakarta coordinates as fallback
      }
      return crisisApi.getEvents({ limit: 20, hours_back: 24 })
    },
    refetchInterval: 30000,
  })

  // Fetch alerts
  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts', 'citizen'],
    queryFn: () => dashboardApi.getAlerts('citizen'),
    refetchInterval: 30000,
  })

  // Update store when data changes
  useEffect(() => {
    if (nearbyEvents?.data.events || nearbyEvents?.data) {
      const events = nearbyEvents.data.events || nearbyEvents.data
      setCrisisEvents(Array.isArray(events) ? events : [])
    }
    if (summary?.data.statistics) {
      setDashboardStats(summary.data.statistics)
    }
  }, [nearbyEvents, summary, setCrisisEvents, setDashboardStats])

  const stats = summary?.data.statistics
  const events = nearbyEvents?.data.events || nearbyEvents?.data || []
  const aiSummary = summary?.data.ai_summary
  const alertsList = alerts?.data.alerts || []

  // Safety tips based on current events
  const getSafetyTips = () => {
    const tips = [
      "Keep emergency contact numbers easily accessible",
      "Maintain at least 3 days of food and water supply",
      "Have a family emergency plan and meeting point",
      "Keep important documents in waterproof container",
      "Stay informed through official channels only"
    ]

    // Add event-specific tips
    if (events.some(e => e.crisis_type === 'earthquake')) {
      tips.unshift("Drop, Cover, and Hold On during earthquakes")
    }
    if (events.some(e => e.crisis_type === 'flood')) {
      tips.unshift("Never drive through flooded roads")
    }
    if (events.some(e => e.crisis_type === 'wildfire')) {
      tips.unshift("Prepare evacuation routes and go-bag")
    }

    return tips.slice(0, 5)
  }

  const emergencyContacts = [
    { name: "Emergency Services", number: "112", type: "primary" },
    { name: "Police", number: "110", type: "police" },
    { name: "Fire Department", number: "113", type: "fire" },
    { name: "Medical Emergency", number: "119", type: "medical" },
    { name: "Disaster Hotline", number: "129", type: "disaster" }
  ]

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading safety information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2 mb-2">
          <span>👥</span>
          <span>Citizen Safety Dashboard</span>
        </h1>
        <p className="text-gray-600">Stay informed and protect yourself and your family</p>
        {userLocation && (
          <p className="text-sm text-blue-600 mt-1 flex items-center justify-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>Monitoring: {userLocation}</span>
          </p>
        )}
      </div>

      {/* Critical Alerts */}
      {alertsList.filter(alert => alert.severity === 'critical').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">🚨 Critical Safety Alert</h3>
              {alertsList
                .filter(alert => alert.severity === 'critical')
                .slice(0, 2)
                .map((alert, index) => (
                  <div key={index} className="text-red-800 text-sm mb-2">
                    <strong>{alert.type} in {alert.location}</strong> - {alert.message}
                  </div>
                ))
              }
              <p className="text-red-700 text-sm font-medium">
                📞 Call 112 for immediate emergency assistance
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Safety Guidance */}
      {aiSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Personal Safety Guidance</h3>
              <p className="text-blue-800 text-sm leading-relaxed">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Crisis Map */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Crisis Events Near You</span>
              </h3>
            </div>
            <div className="p-4">
              <CrisisMap height="350px" />
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Info className="w-5 h-5" />
                <span>Current Situation</span>
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
                          <span>🕒 {formatRelativeTime(event.created_at)}</span>
                        </div>
                      </div>
                      
                      {/* Safety recommendations */}
                      {event.severity === 'high' || event.severity === 'critical' ? (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                          <strong>Safety Tip:</strong> {
                            event.crisis_type === 'earthquake' ? 'Stay away from tall buildings and glass. Have your emergency kit ready.' :
                            event.crisis_type === 'flood' ? 'Avoid flooded areas and have evacuation routes planned.' :
                            event.crisis_type === 'wildfire' ? 'Monitor evacuation notices and prepare go-bag.' :
                            'Follow official guidance and stay alert for updates.'
                          }
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              
              {events.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No immediate threats detected in your area</p>
                  <p className="text-xs mt-1">Continue monitoring for updates</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Emergency Contacts */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Emergency Contacts</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{contact.name}</span>
                  <a
                    href={`tel:${contact.number}`}
                    className="text-sm font-mono font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Safety Tips</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {getSafetyTips().map((tip, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
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
                <span>Quick Actions</span>
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                🚨 Report Emergency
              </button>
              <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                📍 Find Safe Shelter
              </button>
              <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                👥 Check on Family
              </button>
              <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                📱 Get Updates
              </button>
            </div>
          </div>

          {/* Safety Status */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Your Safety Status</span>
              </h3>
            </div>
            <div className="p-4">
              {alertsList.some(a => a.severity === 'critical') ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-600">High Alert</p>
                  <p className="text-xs text-gray-600 mt-1">Follow emergency guidance</p>
                </div>
              ) : alertsList.some(a => a.severity === 'high') ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-sm font-medium text-yellow-600">Caution Advised</p>
                  <p className="text-xs text-gray-600 mt-1">Stay alert and prepared</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-green-600">All Clear</p>
                  <p className="text-xs text-gray-600 mt-1">No immediate threats</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CitizenDashboard