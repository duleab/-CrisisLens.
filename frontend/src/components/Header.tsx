import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getRoleIcon, getRoleColor } from '../lib/utils'
import { 
  Bell, 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff,
  AlertTriangle 
} from 'lucide-react'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { 
    userRole, 
    userLocation, 
    isConnected, 
    dashboardStats,
    reset 
  } = useAppStore()

  const handleLogout = () => {
    reset()
    navigate('/')
  }

  const handleRoleChange = () => {
    navigate('/select-role')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo and breadcrumb */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CL</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">CrisisLens</h1>
          </div>
          
          <div className="text-gray-400">|</div>
          
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getRoleIcon(userRole || 'citizen')}</span>
            <span className="text-lg font-medium capitalize text-gray-700">
              {userRole} Dashboard
            </span>
          </div>
        </div>

        {/* Center: Quick stats */}
        <div className="hidden md:flex items-center space-x-6">
          {dashboardStats && (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Total Events:</span>
                <span className="font-semibold">{dashboardStats.totalEvents}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Verified:</span>
                <span className="font-semibold">{dashboardStats.verified}</span>
              </div>
              
              {dashboardStats.criticalEvents > 0 && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">{dashboardStats.criticalEvents} Critical</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Status and controls */}
        <div className="flex items-center space-x-4">
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Disconnected</span>
              </div>
            )}
          </div>

          {/* Location indicator */}
          {userLocation && (
            <div className="text-sm text-gray-600 hidden sm:block">
              📍 {userLocation}
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings dropdown */}
          <div className="relative group">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                <button
                  onClick={handleRoleChange}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-3">{getRoleIcon(userRole || 'citizen')}</span>
                  Change Role
                </button>
                
                <hr className="my-2" />
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Role badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(userRole || 'citizen')}`}>
            {userRole?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header