import React, { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { initializeWebSocket, disconnectWebSocket } from '../lib/websocket'
import { generateId } from '../lib/utils'
import Header from './Header'
import Sidebar from './Sidebar'
import ChatWidget from './ChatWidget'

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userRole, sessionId, setSessionId } = useAppStore()

  useEffect(() => {
    // Redirect to role selection if no role is set
    if (!userRole) {
      navigate('/select-role')
      return
    }

    // Initialize session if not exists
    if (!sessionId) {
      const newSessionId = generateId()
      setSessionId(newSessionId)
    }

    // Initialize WebSocket connection
    const clientId = sessionId || generateId()
    const wsManager = initializeWebSocket(clientId)
    
    wsManager.connect().catch(error => {
      console.error('Failed to connect WebSocket:', error)
    })

    return () => {
      disconnectWebSocket()
    }
  }, [userRole, sessionId, setSessionId, navigate])

  // Don't render if no user role
  if (!userRole) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Chat widget */}
      <ChatWidget />
    </div>
  )
}

export default Layout