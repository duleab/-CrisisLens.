import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { LatLngBounds, divIcon } from 'leaflet'
import type { CrisisEvent } from '../api'

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  earthquake: { emoji: '⚡', color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
  flood:      { emoji: '💧', color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd' },
  volcano:    { emoji: '🌋', color: '#f97316', bg: '#ffedd5', border: '#fdba74' },
  wildfire:   { emoji: '🔥', color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
  landslide:  { emoji: '⛰️', color: '#22c55e', bg: '#dcfce7', border: '#86efac' },
  storm:      { emoji: '🌀', color: '#6366f1', bg: '#e0e7ff', border: '#a5b4fc' },
  disease:    { emoji: '🦠', color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd' },
  tsunami:    { emoji: '🌊', color: '#06b6d4', bg: '#cffafe', border: '#67e8f9' },
  other:      { emoji: '⚠️', color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
}

const SEVERITY_SIZE: Record<string, number> = {
  critical: 40, high: 34, medium: 28, low: 22,
}

function createMarkerIcon(type: string, severity: string, confidence: number) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other
  const size = SEVERITY_SIZE[severity] || 26
  const isPulsing = severity === 'critical' || severity === 'high'

  const html = `
    <div style="
      width:${size}px; height:${size}px;
      background:${cfg.color};
      border:2.5px solid white;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,0.3);
      font-size:${size * 0.45}px;
      position:relative;
      cursor:pointer;
    ">
      ${isPulsing ? `<span style="
        position:absolute; inset:-6px;
        border-radius:50%;
        border:2px solid ${cfg.color};
        animation:markerRing 1.8s ease-out infinite;
        opacity:0.6;
      "></span>` : ''}
      ${cfg.emoji}
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

function FitBounds({ events }: { events: CrisisEvent[] }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    const geo = events.filter(e => e.latitude != null && e.longitude != null)
    if (geo.length === 0) {
      // Default center on Indonesia/SEA
      map.setView([-2.5, 118.0], 4)
      return
    }
    if (fitted.current && geo.length < 5) return
    const bounds = new LatLngBounds(geo.map(e => [e.latitude!, e.longitude!] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 })
    fitted.current = true
  }, [events.length, map])

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

const SEV_LABEL: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-600 bg-red-50' },
  high:     { label: 'High',     color: 'text-orange-600 bg-orange-50' },
  medium:   { label: 'Medium',   color: 'text-yellow-700 bg-yellow-50' },
  low:      { label: 'Low',      color: 'text-green-700 bg-green-50' },
}

interface Props {
  events: CrisisEvent[]
  darkMode: boolean
}

export default function CrisisMap({ events, darkMode }: Props) {
  const geoEvents = events.filter(e => e.latitude != null && e.longitude != null)

  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const tileAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[-2.5, 118.0]}
        zoom={4}
        style={{ height: '100%', width: '100%', borderRadius: '0' }}
        zoomControl={true}
      >
        <TileLayer url={tileUrl} attribution={tileAttr} />
        <FitBounds events={geoEvents} />

        {geoEvents.map(e => {
          const cfg = TYPE_CONFIG[e.crisis_type] || TYPE_CONFIG.other
          const sev = SEV_LABEL[e.severity] || SEV_LABEL.low

          return (
            <Marker
              key={e.id}
              position={[e.latitude!, e.longitude!]}
              icon={createMarkerIcon(e.crisis_type, e.severity, e.system_confidence)}
            >
              <Popup maxWidth={240}>
                <div style={{ fontFamily: 'Inter, sans-serif', padding: '12px', minWidth: '200px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{
                      background: cfg.color, color: 'white',
                      padding: '2px 8px', borderRadius: '999px',
                      fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px',
                    }}>
                      {cfg.emoji} {e.crisis_type.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: '600',
                      padding: '2px 6px', borderRadius: '999px',
                    }} className={sev.color}>
                      {sev.label}
                    </span>
                  </div>
                  {/* Location */}
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#111', marginBottom: '4px' }}>
                    📍 {e.location_name || e.country_iso || 'Unknown'}
                  </div>
                  {/* Details */}
                  <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.6' }}>
                    <div>🎯 Confidence: <strong>{(e.system_confidence * 100).toFixed(0)}%</strong></div>
                    {e.magnitude && <div>📊 Magnitude: <strong>{e.magnitude}</strong></div>}
                    {e.casualties_estimated && <div>👥 Affected: <strong>{e.casualties_estimated.toLocaleString()}</strong></div>}
                    <div>🔗 Source: <strong>{e.source_names.join(', ')}</strong></div>
                    {e.event_date && <div>⏰ {timeAgo(e.event_date)}</div>}
                    <div>{e.official_confirmed ? '✅ Officially verified' : '⚪ Unverified'}</div>
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
        background: 'rgba(255,255,255,0.95)', borderRadius: '10px',
        padding: '8px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '6px 12px', maxWidth: '320px',
      }}>
        {Object.entries(TYPE_CONFIG).filter(([k]) => k !== 'other').map(([type, cfg]) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#444' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>
    </div>
  )
}
