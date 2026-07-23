import { useState, useMemo, useEffect, useRef } from 'react'
import type { CrisisEvent } from '../api'
import CrisisMap from '../components/CrisisMap'
import { SEVERITY_STYLE } from '../constants'

interface Props {
  events: CrisisEvent[]
  darkMode: boolean
  region: 'sea' | 'world'
}

export default function MapPage({ events, darkMode, region }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>()
  const [filterSeverity, setFilterSeverity] = useState<Record<string, boolean>>({
    critical: true, high: true, medium: true, low: true, info: true
  })
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (!filterSeverity[e.severity.toLowerCase()]) return false
      if (filterVerifiedOnly && !e.official_confirmed) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !e.location_name?.toLowerCase().includes(q) &&
          !e.country_iso?.toLowerCase().includes(q) &&
          !e.crisis_type.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      return true
    }).sort((a, b) => {
      // Sort by severity weight
      const weight: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, info: 1 }
      const aW = weight[a.severity.toLowerCase()] || 0
      const bW = weight[b.severity.toLowerCase()] || 0
      if (aW !== bW) return bW - aW
      // Then by date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [events, filterSeverity, filterVerifiedOnly, searchQuery])

  // Refs for scrolling the list
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (selectedEventId && itemRefs.current[selectedEventId]) {
      itemRefs.current[selectedEventId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedEventId])

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <CrisisMap 
          events={filteredEvents} 
          darkMode={darkMode} 
          region={region} 
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
        />
      </div>

      {/* Side Panel */}
      <div className={`w-80 flex-shrink-0 flex flex-col border-l z-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3">Map Filters</h2>
          
          <input
            type="text"
            placeholder="Search location or type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm mb-3 border focus:ring-2 focus:outline-none transition-shadow ${
              darkMode 
                ? 'bg-gray-900 border-gray-700 focus:ring-blue-500/50 text-white' 
                : 'bg-gray-50 border-gray-200 focus:ring-blue-500/30'
            }`}
          />

          <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={filterVerifiedOnly} 
              onChange={e => setFilterVerifiedOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Verified Sources Only</span>
          </label>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(SEVERITY_STYLE).map(sev => {
                const s = SEVERITY_STYLE[sev]
                const checked = filterSeverity[sev]
                return (
                  <label key={sev} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer border transition-colors ${
                    checked 
                      ? (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300')
                      : 'opacity-50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={checked}
                      onChange={e => setFilterSeverity(prev => ({ ...prev, [sev]: e.target.checked }))}
                    />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                    <span className="capitalize">{sev}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2" ref={listRef}>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 pt-2 pb-3">
            {filteredEvents.length} Events Listed
          </div>
          <div className="space-y-1.5">
            {filteredEvents.map(e => {
              const isSelected = selectedEventId === e.id
              const sev = SEVERITY_STYLE[e.severity.toLowerCase()] || SEVERITY_STYLE.info
              return (
                <div
                  key={e.id}
                  ref={el => itemRefs.current[e.id] = el}
                  onClick={() => setSelectedEventId(e.id)}
                  className={`p-3 rounded-lg cursor-pointer border transition-all ${
                    isSelected 
                      ? (darkMode ? 'bg-blue-900/30 border-blue-500/50' : 'bg-blue-50 border-blue-200')
                      : (darkMode ? 'bg-gray-800/50 border-transparent hover:bg-gray-700' : 'bg-white border-transparent hover:bg-gray-50')
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: sev.color, color: 'white' }}>
                      {sev.label}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(e.system_confidence * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                  <div className={`font-semibold text-sm truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {e.location_name || e.country_iso || 'Unknown Location'}
                  </div>
                  <div className={`text-xs mt-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {e.crisis_type.toUpperCase()} • {e.source_names.join(', ')}
                  </div>
                </div>
              )
            })}
            {filteredEvents.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No events match your filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
