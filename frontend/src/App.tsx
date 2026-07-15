import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store/useAppStore'

// Pages
import LandingPage from './pages/LandingPage'
import CitizenDashboard from './pages/CitizenDashboard'
import GovernmentDashboard from './pages/GovernmentDashboard'
import ResponderDashboard from './pages/ResponderDashboard'
import TouristDashboard from './pages/TouristDashboard'

// Components
import Layout from './components/Layout'
import RoleSelector from './components/RoleSelector'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { userRole } = useAppStore()

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Role selection */}
            <Route path="/select-role" element={<RoleSelector />} />
            
            {/* Role-specific dashboards */}
            <Route path="/dashboard" element={<Layout />}>
              <Route 
                index 
                element={
                  userRole ? (
                    <Navigate to={`/dashboard/${userRole}`} replace />
                  ) : (
                    <Navigate to="/select-role" replace />
                  )
                } 
              />
              <Route path="citizen" element={<CitizenDashboard />} />
              <Route path="government" element={<GovernmentDashboard />} />
              <Route path="responder" element={<ResponderDashboard />} />
              <Route path="tourist" element={<TouristDashboard />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App