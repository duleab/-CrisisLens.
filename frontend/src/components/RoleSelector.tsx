import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, UserRole } from '../store/useAppStore'
import { getRoleIcon } from '../lib/utils'
import { MapPin, Check } from 'lucide-react'

const RoleSelector: React.FC = () => {
  const navigate = useNavigate()
  const { setUserRole, setUserLocation } = useAppStore()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [location, setLocation] = useState('')

  const roles = [
    {
      id: 'citizen' as UserRole,
      name: 'Citizen',
      icon: '👥',
      description: 'Personal safety and family protection guidance',
      features: [
        'Personal safety alerts',
        'Evacuation guidance',
        'Emergency contacts',
        'Family protection tips'
      ],
      color: 'bg-blue-100 border-blue-300 text-blue-800'
    },
    {
      id: 'government' as UserRole,
      name: 'Government Official',
      icon: '🏛️',
      description: 'Strategic decisions and resource coordination',
      features: [
        'Resource allocation insights',
        'Policy decision support',
        'Coordination guidance',
        'Situation assessments'
      ],
      color: 'bg-purple-100 border-purple-300 text-purple-800'
    },
    {
      id: 'responder' as UserRole,
      name: 'Emergency Responder',
      icon: '🚑',
      description: 'Tactical operations and rescue coordination',
      features: [
        'Operational priorities',
        'Rescue coordination',
        'Resource deployment',
        'Tactical guidance'
      ],
      color: 'bg-red-100 border-red-300 text-red-800'
    },
    {
      id: 'tourist' as UserRole,
      name: 'Tourist/Traveler',
      icon: '✈️',
      description: 'Travel safety and destination guidance',
      features: [
        'Travel advisories',
        'Destination safety',
        'Embassy contacts',
        'Transportation updates'
      ],
      color: 'bg-green-100 border-green-300 text-green-800'
    }
  ]

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (!selectedRole) return

    setUserRole(selectedRole)
    if (location.trim()) {
      setUserLocation(location.trim())
    }
    
    navigate(`/dashboard/${selectedRole}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">CL</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">CrisisLens AI</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select your role to get personalized crisis intelligence and guidance tailored to your needs
          </p>
        </div>

        {/* Role cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`
                cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg
                ${selectedRole === role.id 
                  ? `${role.color} border-current shadow-lg scale-105` 
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{role.icon}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {role.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {role.description}
                    </p>
                  </div>
                </div>
                
                {selectedRole === role.id && (
                  <div className="w-6 h-6 bg-current rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {role.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Location input */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Location (Optional)
            </h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Providing your location helps us give you more relevant crisis information and guidance.
          </p>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your city or region (e.g., Jakarta, Indonesia)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Continue button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Dashboard
          </button>
          
          {!selectedRole && (
            <p className="text-sm text-gray-500 mt-2">
              Please select a role to continue
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            CrisisLens AI • Real-time Crisis Intelligence Platform
          </p>
          <p className="mt-1">
            Powered by advanced AI for disaster detection and management
          </p>
        </div>
      </div>
    </div>
  )
}

export default RoleSelector