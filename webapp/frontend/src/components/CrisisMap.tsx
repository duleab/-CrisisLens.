import { useEffect, useRef, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { LatLngBounds, divIcon } from 'leaflet'
import type { CrisisEvent } from '../api'
import { SEVERITY_STYLE, CRISIS_ICON, DEFAULT_ICON, getSeverityStyle, getCrisisIcon } from '../constants'

const SEVERITY_SIZE: Record<string, number> = {
  critical: 46, high: 38, medium: 32, low: 26, info: 24,
  CRITICAL: 46, HIGH: 38, MEDIUM: 32, LOW: 26, INFO: 24,
  Critical: 46, High: 38, Medium: 32, Low: 26, Info: 24,
}

function createMarkerIcon(type: string, severity: string, confidence: number, confirmed: boolean) {
  const sev = getSeverityStyle(severity)
  const size = SEVERITY_SIZE[severity] || SEVERITY_SIZE[(severity || '').toLowerCase()] || 28
  const IconComp = getCrisisIcon(type)
  const iconSvg = renderToStaticMarkup(createElement(IconComp, { size: Math.floor(size * 0.52), color: 'white' }))
  const borderStyle = confirmed ? 'solid' : 'dashed'
  const borderWidth = sev.pulse ? '4px' : '3px'

  const html = `
    <div class="${sev.pulse ? 'critical-pulse' : ''}" style="
      width:${size}px; height:${size}px;
      background:${sev.color};
      border:${borderWidth} ${borderStyle} #ffffff;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:${sev.boxShadow};
      position:relative;
      cursor:pointer;
    ">
      ${sev.pulse ? `<span class="marker-ring" style="border-color:${sev.color}"></span>` : ''}
      ${iconSvg}
    </div>
  `
  return divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  })
}

function FitBounds({ events, region }: { events: CrisisEvent[]; region?: 'sea' | 'world' }) {
  const map = useMap()
  const fitted = useRef(false)
  const prevRegion = useRef(region)

  useEffect(() => {
    if (prevRegion.current !== region) {
      fitted.current = false
      prevRegion.current = region
    }
    const geo = events.filter(e => e.latitude != null && e.longitude != null)
    if (geo.length === 0 || !fitted.current) {
      if (region === 'sea') {
        map.setView([2.5, 112.0], 4)
      } else if (region === 'world') {
        map.setView([20.0, 0.0], 2)
      } else if (geo.length === 0) {
        map.setView([-2.5, 118.0], 4)
        return
      }
    }
    if (geo.length > 0 && (!fitted.current || geo.length >= 5)) {
      const bounds = new LatLngBounds(geo.map(e => [e.latitude!, e.longitude!] as [number, number]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: region === 'sea' ? 7 : 5 })
      fitted.current = true
    }
  }, [events.length, map, region])

  return null
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface Props {
  events: CrisisEvent[]
  darkMode: boolean
  region?: 'sea' | 'world'
}

export default function CrisisMap({ events, darkMode, region = 'sea' }: Props) {
  const geoEvents = events.filter(e => e.latitude != null && e.longitude != null)

  // Track coordinate frequency to apply slight radial jitter so markers at exact same spot don't overlap completely
  const coordCounts: Record<string, number> = {}
  const jitteredEvents = geoEvents.map(e => {
    const key = `${e.latitude?.toFixed(3)}_${e.longitude?.toFixed(3)}`
    const count = coordCounts[key] || 0
    coordCounts[key] = count + 1

    if (count === 0) return e
    // Apply spiral/radial offset (approx 3-6km per step depending on zoom)
    const angle = count * 2.4  // Golden angle approximation
    const radius = 0.08 * Math.sqrt(count)
    return {
      ...e,
      latitude: e.latitude! + radius * Math.sin(angle),
      longitude: e.longitude! + radius * Math.cos(angle),
    }
  })

  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={region === 'sea' ? [2.5, 112.0] : [20.0, 0.0]}
        zoom={region === 'sea' ? 4 : 2}
        style={{ height: '100%', width: '100%', borderRadius: '0' }}
        zoomControl={true}
      >
        <TileLayer url={tileUrl} attribution={tileAttr} />
        <FitBounds events={geoEvents} region={region} />

        {jitteredEvents.map(e => {
          const sev = getSeverityStyle(e.severity)

          return (
            <Marker
              key={e.id}
              position={[e.latitude!, e.longitude!]}
              icon={createMarkerIcon(e.crisis_type, e.severity, e.system_confidence, e.official_confirmed)}
            >
              <Popup maxWidth={280}>
                <div style={{ fontFamily: 'Inter, sans-serif', padding: '10px', minWidth: '220px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      background: sev.color, color: 'white',
                      padding: '3px 9px', borderRadius: '999px',
                      fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
                    }}>
                      {sev.label}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', color: '#666',
                      textTransform: 'uppercase',
                    }}>
                      {e.crisis_type}
                    </span>
                  </div>
                  {/* Location */}
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#111', marginBottom: '6px' }}>
                    📍 {e.location_name || e.country_iso || 'Unknown'}
                  </div>
                  {/* Details */}
                  <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.6' }}>
                    <div>🎯 Confidence: <strong>{(e.system_confidence * 100).toFixed(0)}%</strong></div>
                    {e.magnitude && <div>📊 Magnitude: <strong>{e.magnitude}</strong></div>}
                    {e.casualties_estimated && <div>👥 Affected: <strong>{e.casualties_estimated.toLocaleString()}</strong></div>}
                    <div>🔗 Source: <strong>{e.source_names.join(', ')}</strong></div>
                    {e.event_date && <div>⏰ {timeAgo(e.event_date)}</div>}
                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
                      {e.official_confirmed ? (
                        <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', itemsCenter: 'center', gap: '4px' }}>
                          ✅ Officially verified (Solid border)
                        </span>
                      ) : (
                        <span style={{ color: '#d97706', fontWeight: 600, display: 'flex', itemsCenter: 'center', gap: '4px' }}>
                          ⚪ Unverified / Single source (Dashed)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '12px', zIndex: 1000,
        background: darkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
        color: darkMode ? '#cbd5e1' : '#334155',
        borderRadius: '12px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        fontSize: '11px', maxWidth: '340px', border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '12px' }}>Severity Hierarchy & Visual Ring</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px', borderBottom: '1px solid rgba(150,150,150,0.2)', paddingBottom: '6px' }}>
          {(['critical', 'high', 'medium', 'low', 'info'] as const).map(sevKey => {
            const s = SEVERITY_STYLE[sevKey]
            return (
              <span key={sevKey} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                <span style={{ textTransform: 'capitalize', fontWeight: sevKey === 'critical' ? 700 : 500 }}>{sevKey}</span>
              </span>
            )
          })}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.85 }}>
          <div>🛡️ <strong>Solid ring border</strong> = Officially verified (USGS, BMKG, UN/GDACS, EONET)</div>
          <div>⚪ <strong>Dashed ring border</strong> = Unverified or Single news source</div>
          <div>🔥 <strong>Pulsing animation</strong> = Critical severity indicator</div>
        </div>
      </div>
    </div>
  )
}
