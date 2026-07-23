import { useState, useMemo } from 'react'
import { fetchReport, updateEventStatus, type CrisisEvent } from '../api'
import { SEVERITY_STYLE, getCrisisIcon } from '../constants'

interface Props {
  events: CrisisEvent[]
  darkMode: boolean
}

type StatusCol = 'new' | 'monitoring' | 'responding' | 'resolved'

const COLUMNS: { id: StatusCol; label: string; color: string }[] = [
  { id: 'new', label: 'New Incidents', color: 'bg-blue-500' },
  { id: 'monitoring', label: 'Monitoring', color: 'bg-yellow-500' },
  { id: 'responding', label: 'Responding', color: 'bg-red-500' },
  { id: 'resolved', label: 'Resolved', color: 'bg-green-500' }
]

export default function CommandCenterPage({ events: initialEvents, darkMode }: Props) {
  const [events, setEvents] = useState<CrisisEvent[]>(initialEvents)
  const [report, setReport] = useState<string>('')
  const [reportLoading, setReportLoading] = useState(false)

  // Update events when props change, but keep local state for optimism
  useMemo(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  const handleStatusChange = async (event: CrisisEvent, newStatus: StatusCol) => {
    // Optimistic update
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: newStatus } : e))
    try {
      await updateEventStatus(event.id, newStatus)
    } catch (e) {
      console.error(e)
      // Revert on failure
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: event.status } : e))
    }
  }

  const generateReport = async () => {
    setReportLoading(true)
    try {
      const res = await fetchReport('sea')
      setReport(res.report)
    } catch (e) {
      setReport(`⚠️ Failed to generate report: ${e}`)
    } finally {
      setReportLoading(false)
    }
  }

  // Priority Ranking calculation
  const rankedEvents = useMemo(() => {
    return [...events].map(e => {
      const sevW = e.severity === 'critical' ? 10 : e.severity === 'high' ? 7 : e.severity === 'medium' ? 4 : 1
      const mag = e.magnitude || 1
      const cas = e.casualties_estimated ? Math.max(1, e.casualties_estimated) : 1
      const score = sevW * mag * cas * (e.system_confidence || 0.1)
      return { ...e, priorityScore: score }
    })
    .filter(e => e.status !== 'resolved')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10) // Top 10
  }, [events])

  return (
    <div className={`flex flex-col h-full w-full overflow-y-auto p-4 md:p-6 gap-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Command Center</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Tactical event management and automated intelligence reporting.
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={reportLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {reportLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Generating...
            </>
          ) : (
            <>
              <span>📄</span> Generate Situation Report
            </>
          )}
        </button>
      </div>

      {/* Report Modal / Section */}
      {report && (
        <div className={`p-6 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-indigo-500">✨</span> AI Situation Report
            </h2>
            <button onClick={() => setReport('')} className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              Dismiss
            </button>
          </div>
          <div className={`text-[15px] leading-relaxed whitespace-pre-wrap font-sans ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {report}
          </div>
        </div>
      )}

      {/* Top Section: Kanban Board */}
      <div className="flex-1 min-h-[400px]">
        <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Incidents Board</h2>
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colEvents = events.filter(e => (e.status || 'new') === col.id)
            return (
              <div key={col.id} className={`flex flex-col min-w-[300px] w-[300px] rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-100/50 border-gray-200'}`}>
                {/* Column Header */}
                <div className="p-3 flex items-center justify-between border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${col.color}`}></span>
                    <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-500 shadow-sm'}`}>
                    {colEvents.length}
                  </span>
                </div>
                
                {/* Column Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colEvents.map(e => {
                    const sev = SEVERITY_STYLE[e.severity.toLowerCase()] || SEVERITY_STYLE.info
                    const Icon = getCrisisIcon(e.crisis_type)
                    return (
                      <div key={e.id} className={`p-3 rounded-lg border shadow-sm flex flex-col gap-2 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5">
                            <Icon size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={`text-sm font-semibold uppercase ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {e.crisis_type}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: sev.color, color: 'white' }}>
                            {sev.label}
                          </span>
                        </div>
                        
                        <div className={`text-xs font-medium truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} title={e.location_name || e.country_iso || ''}>
                          📍 {e.location_name || e.country_iso || 'Unknown Location'}
                        </div>
                        
                        {/* Status Actions */}
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-inherit">
                          {COLUMNS.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleStatusChange(e, c.id)}
                              disabled={c.id === col.id}
                              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                                c.id === col.id 
                                  ? `${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-default`
                                  : `${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`
                              }`}
                            >
                              {c.id === 'new' ? 'New' : c.id === 'monitoring' ? 'Mon' : c.id === 'responding' ? 'Resp' : 'Resv'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {colEvents.length === 0 && (
                    <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No events in {col.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Section: Resource Priority Ranking */}
      <div>
        <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Resource Priority Allocation (Top 10)</h2>
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                  <th className="px-4 py-3 font-semibold text-gray-500">Rank</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Event</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Severity</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Casualties</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-right">Priority Score</th>
                </tr>
              </thead>
              <tbody>
                {rankedEvents.map((e, idx) => {
                  const sev = SEVERITY_STYLE[e.severity.toLowerCase()] || SEVERITY_STYLE.info
                  return (
                    <tr key={e.id} className={`border-b last:border-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className="px-4 py-3 font-bold text-gray-400">#{idx + 1}</td>
                      <td className={`px-4 py-3 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {e.crisis_type.toUpperCase()} - {e.location_name || e.country_iso}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: sev.color, color: 'white' }}>
                          {sev.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {e.casualties_estimated?.toLocaleString() || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {e.status || 'new'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {e.priorityScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  )
                })}
                {rankedEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No active events requiring resource allocation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
