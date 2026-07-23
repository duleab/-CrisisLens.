import { useEffect, useState, useCallback, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { fetchEvents, fetchStats, triggerIngest, type CrisisEvent, type Stats } from './api'
import Sidebar from './components/Sidebar'
import type { Role } from './components/Sidebar'
import Header from './components/Header'
import ChatPanel from './components/ChatPanel'
import CitizenDashboard from './pages/CitizenDashboard'
import GovernmentDashboard from './pages/GovernmentDashboard'
import ResponderDashboard from './pages/ResponderDashboard'
import TouristDashboard from './pages/TouristDashboard'
import MapPage from './pages/MapPage'
import AssistantPage from './pages/AssistantPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CommandCenterPage from './pages/CommandCenterPage'

const AUTO_REFRESH_SECS = 60

export default function App() {
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('cl_role') as Role) || 'citizen')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cl_dark') === 'true')
  const [region, setRegion] = useState<'sea' | 'world'>('world')
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '14d' | '30d' | 'all'>('all')
  const [events, setEvents] = useState<CrisisEvent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [systemOnline, setSystemOnline] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECS)
  const prevCountRef = useRef(0)

  // Apply dark mode class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('cl_dark', String(darkMode))
  }, [darkMode])

  // Persist role
  useEffect(() => {
    localStorage.setItem('cl_role', role)
  }, [role])

  const loadData = useCallback(async (isManual = false, reg: 'sea' | 'world' = region) => {
    try {
      setLoading(true)
      const [evData, statsData] = await Promise.all([fetchEvents(200, reg), fetchStats(reg)])
      const newCount = evData.length

      // Show toast if new events appeared
      if (prevCountRef.current > 0 && newCount > prevCountRef.current) {
        const diff = newCount - prevCountRef.current
        setToast(`🔔 ${diff} new event${diff > 1 ? 's' : ''} detected!`)
        setTimeout(() => setToast(null), 4000)
      }
      prevCountRef.current = newCount

      setEvents(evData)
      setStats(statsData)
      setSystemOnline(true)
      setLastUpdated(new Date())
      setCountdown(AUTO_REFRESH_SECS)
    } catch (e) {
      setSystemOnline(false)
      if (isManual) {
        setToast(`⚠️ Failed to load data: ${e}`)
        setTimeout(() => setToast(null), 4000)
      }
    } finally {
      setLoading(false)
    }
  }, [region])

  const handleIngest = async () => {
    setLoading(true)
    try {
      const result = await triggerIngest()
      setToast(`✅ Fetched ${result.fetched} events, saved ${result.saved} new`)
      setTimeout(() => setToast(null), 4000)
      await loadData()
    } catch (e) {
      setToast(`⚠️ Ingest failed: ${e}`)
      setTimeout(() => setToast(null), 4000)
      setLoading(false)
    }
  }

  // Initial load & when region changes
  useEffect(() => { loadData(false, region) }, [loadData, region])

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          loadData()
          return AUTO_REFRESH_SECS
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loadData])

  const filteredEvents = events.filter(e => {
    if (timeFilter === 'all' || !e.event_date) return true
    const d = new Date(e.event_date)
    const hours = (Date.now() - d.getTime()) / (1000 * 60 * 60)
    if (timeFilter === '24h') return hours <= 24
    if (timeFilter === '7d') return hours <= 24 * 7
    if (timeFilter === '14d') return hours <= 24 * 14
    if (timeFilter === '30d') return hours <= 24 * 30
    return true
  })

  const criticalCount = filteredEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <Sidebar role={role} darkMode={darkMode} events={filteredEvents} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          role={role}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
          onRoleChange={setRole}
          region={region}
          onRegionChange={setRegion}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          lastUpdated={lastUpdated}
          systemOnline={systemOnline}
          notifCount={criticalCount}
          onRefresh={() => loadData(true)}
          loading={loading}
        />

        {/* Loading bar */}
        {loading && (
          <div className="h-0.5 bg-blue-600 animate-pulse flex-shrink-0" style={{ width: '100%' }} />
        )}

        {/* Dashboard content */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={
              role === 'government' ? <GovernmentDashboard events={filteredEvents} stats={stats} darkMode={darkMode} region={region} /> :
              role === 'responder' ? <ResponderDashboard events={filteredEvents} stats={stats} darkMode={darkMode} region={region} /> :
              role === 'tourist' ? <TouristDashboard events={filteredEvents} stats={stats} darkMode={darkMode} region={region} /> :
              <CitizenDashboard events={filteredEvents} stats={stats} darkMode={darkMode} loading={loading} onIngest={handleIngest} region={region} />
            } />
            <Route path="/map" element={<MapPage events={filteredEvents} darkMode={darkMode} region={region} />} />
            <Route path="/assistant" element={<AssistantPage darkMode={darkMode} initialRole={role} />} />
            <Route path="/analytics" element={<AnalyticsPage events={filteredEvents} darkMode={darkMode} />} />
            <Route path="/command-center" element={<CommandCenterPage events={filteredEvents} darkMode={darkMode} />} />
            
            {/* Fallback for other items for now */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Auto-refresh countdown badge */}
      <div className={`fixed bottom-5 right-5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shadow-lg z-50 ${
        darkMode ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-600 shadow-md'
      }`}>
        <span className="w-2 h-2 rounded-full bg-blue-500 live-dot" />
        Auto-refresh in {countdown}s
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-16 right-5 px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50 max-w-xs fade-in ${
          toast.startsWith('⚠️')
            ? darkMode ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-red-50 text-red-800 border border-red-200'
            : darkMode ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'
        }`}>
          {toast}
        </div>
      )}

      {/* Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 py-2 px-5 border-t text-xs flex items-center justify-between z-40 ${
        darkMode ? 'bg-gray-900 border-gray-700 text-gray-500' : 'bg-white border-gray-100 text-gray-400'
      }`}>
        <span>CrisisLens AI 2.0 — Empowering Citizens. Strengthening Tomorrow.</span>
        <span>Powered by Multi-Source Intelligence and AI</span>
        <span>© 2026 CrisisLens AI</span>
      </footer>
    </div>
  )
}
