import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchAnalyticsSummary, type CrisisEvent } from '../api'
import { SEVERITY_STYLE, getCrisisIcon } from '../constants'

interface Props {
  events: CrisisEvent[]
  darkMode: boolean
}

export default function AnalyticsPage({ events, darkMode }: Props) {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState<keyof CrisisEvent>('system_confidence')
  const [sortDesc, setSortDesc] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAnalyticsSummary()
      .then(data => {
        // Sort events_per_day chronologically
        data.events_per_day.sort((a: any, b: any) => a.date.localeCompare(b.date))
        setSummary(data)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const sortedAndFilteredEvents = useMemo(() => {
    let result = [...events]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(e => 
        e.crisis_type.toLowerCase().includes(q) ||
        (e.location_name || '').toLowerCase().includes(q) ||
        (e.country_iso || '').toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      let aVal = a[sortCol]
      let bVal = b[sortCol]
      if (aVal === null) aVal = ''
      if (bVal === null) bVal = ''
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDesc ? bVal - aVal : aVal - bVal
      }
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortDesc ? (aVal === bVal ? 0 : aVal ? -1 : 1) : (aVal === bVal ? 0 : aVal ? 1 : -1)
      }
      return 0
    })
    
    return result
  }, [events, search, sortCol, sortDesc])

  const handleSort = (col: keyof CrisisEvent) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc)
    } else {
      setSortCol(col)
      setSortDesc(true)
    }
  }

  const exportCSV = () => {
    const headers = ['ID', 'Type', 'Severity', 'Confidence', 'Location', 'Country', 'Magnitude', 'Casualties', 'Verified', 'Date']
    const rows = sortedAndFilteredEvents.map(e => [
      e.id,
      e.crisis_type,
      e.severity,
      e.system_confidence,
      `"${(e.location_name || '').replace(/"/g, '""')}"`,
      e.country_iso || '',
      e.magnitude || '',
      e.casualties_estimated || '',
      e.official_confirmed,
      e.event_date || e.created_at || ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crisis_events_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const chartTheme = {
    text: darkMode ? '#9ca3af' : '#6b7280',
    grid: darkMode ? '#374151' : '#e5e7eb',
    tooltipBg: darkMode ? '#1f2937' : '#ffffff',
    tooltipBorder: darkMode ? '#374151' : '#e5e7eb',
  }

  if (loading) {
    return (
      <div className={`p-8 h-full flex flex-col gap-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="h-full bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="h-full bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!summary || summary.total_events === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p>Wait for the ingestion pipeline to fetch live data.</p>
        </div>
      </div>
    )
  }

  const pieData = Object.entries(summary.by_type).map(([name, value]) => ({ name, value }))
  // Colors based on crisis type for pie chart
  const TYPE_COLORS: Record<string, string> = {
    earthquake: '#dc2626', flood: '#2563eb', storm: '#0891b2', 
    volcano: '#ea580c', wildfire: '#f97316', disease: '#9333ea', default: '#64748b'
  }

  const barData = Object.entries(summary.by_severity).map(([name, value]) => ({ name: name.toUpperCase(), value, fill: SEVERITY_STYLE[name]?.color || '#999' }))

  return (
    <div className={`h-full flex flex-col overflow-y-auto p-4 md:p-6 gap-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Global Analytics</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Insights based on {summary.total_events} recent events</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Affected Population</div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {(summary.total_casualties || 0).toLocaleString()}
          </div>
          <div className="text-xs text-red-500 mt-2 font-medium">Estimated casualties & displaced</div>
        </div>
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg System Confidence</div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {(summary.avg_confidence * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-blue-500 mt-2 font-medium">Across all data sources</div>
        </div>
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Source Verification</div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {summary.total_events > 0 ? Math.round((summary.verified_count / summary.total_events) * 100) : 0}%
          </div>
          <div className="text-xs text-green-500 mt-2 font-medium">{summary.verified_count} verified events</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <div className={`p-5 rounded-2xl border lg:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>14-Day Detection Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.events_per_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={d => d.slice(5)} // MM-DD
                  tick={{ fill: chartTheme.text, fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis tick={{ fill: chartTheme.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: '8px' }}
                  itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Bar Chart */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>By Severity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={chartTheme.grid} />
                <XAxis type="number" tick={{ fill: chartTheme.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: chartTheme.text, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: darkMode ? '#374151' : '#f3f4f6' }}
                  contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Table Section */}
      <div className={`rounded-2xl border flex flex-col min-h-[400px] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-inherit">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Event Data Export</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search type or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`flex-1 sm:w-64 px-3 py-1.5 rounded-lg text-sm border focus:ring-2 focus:outline-none ${
                darkMode ? 'bg-gray-900 border-gray-700 focus:ring-blue-500/50 text-white' : 'bg-gray-50 border-gray-200 focus:ring-blue-500/30'
              }`}
            />
            <button 
              onClick={exportCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              ↓ CSV
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <th className="px-4 py-3 font-semibold text-gray-500 cursor-pointer" onClick={() => handleSort('crisis_type')}>
                  Type {sortCol === 'crisis_type' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-500 cursor-pointer" onClick={() => handleSort('severity')}>
                  Severity {sortCol === 'severity' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-500 cursor-pointer" onClick={() => handleSort('location_name')}>
                  Location {sortCol === 'location_name' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-500 cursor-pointer text-right" onClick={() => handleSort('system_confidence')}>
                  Confidence {sortCol === 'system_confidence' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-500 cursor-pointer text-right" onClick={() => handleSort('casualties_estimated')}>
                  Affected {sortCol === 'casualties_estimated' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="px-4 py-3 font-semibold text-gray-500 cursor-pointer text-center" onClick={() => handleSort('official_confirmed')}>
                  Verified {sortCol === 'official_confirmed' && (sortDesc ? '↓' : '↑')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredEvents.slice(0, 100).map(e => {
                const sev = SEVERITY_STYLE[e.severity.toLowerCase()] || SEVERITY_STYLE.info
                const Icon = getCrisisIcon(e.crisis_type)
                
                return (
                  <tr key={e.id} className={`border-b last:border-0 transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          <Icon size={14} />
                        </div>
                        <span className={`font-medium uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{e.crisis_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: sev.color, color: 'white' }}>
                        {sev.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="truncate max-w-[200px]" title={e.location_name || e.country_iso || ''}>
                        {e.location_name || e.country_iso || 'Unknown'}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {(e.system_confidence * 100).toFixed(0)}%
                    </td>
                    <td className={`px-4 py-3 text-right ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {e.casualties_estimated ? e.casualties_estimated.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.official_confirmed ? '✅' : '⚪'}
                    </td>
                  </tr>
                )
              })}
              {sortedAndFilteredEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No matching events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sortedAndFilteredEvents.length > 100 && (
          <div className="p-3 text-center text-xs text-gray-500 border-t border-inherit">
            Showing top 100 of {sortedAndFilteredEvents.length} results. Export CSV to view all.
          </div>
        )}
      </div>

    </div>
  )
}
