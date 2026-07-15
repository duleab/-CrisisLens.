import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useAppStore } from '../store/useAppStore'
import { getSeverityColor, formatRelativeTime, getCrisisTypeIcon, getCountryFlag } from '../lib/utils'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface CrisisMapProps {
  height?: string
}

// Custom marker component
const CrisisMarker: React.FC<{ event: any }> = ({ event }) => {
  if (!event.coordinates) return null

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316' 
      case 'medium': return '#eab308'
      case 'low': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  const markerIcon = L.divIcon({
    className: 'crisis-marker',
    html: `
      <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold" 
           style="background-color: ${getMarkerColor(event.severity)}">
        ${getCrisisTypeIcon(event.type)}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  return (
    <Marker 
      position={[event.coordinates[0], event.coordinates[1]]} 
      icon={markerIcon}
    >
      <Popup className="crisis-popup" maxWidth={300}>
        <div className="p-2">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getCrisisTypeIcon(event.type)}</span>
              <h3 className="font-semibold text-gray-900 capitalize">
                {event.type}
              </h3>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
              {event.severity.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>📍</span>
              <span>{event.location}</span>
              {event.country && (
                <span>{getCountryFlag(event.country)}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <span>📊</span>
              <span>Confidence: {Math.round(event.confidence * 100)}%</span>
              {event.verified && <span className="text-green-600">✅ Verified</span>}
            </div>
            
            <div className="flex items-center space-x-1">
              <span>🕒</span>
              <span>{formatRelativeTime(event.timestamp)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <span>📰</span>
              <span>Source: {event.source}</span>
            </div>

            {event.details?.magnitude && (
              <div className="flex items-center space-x-1">
                <span>📏</span>
                <span>Magnitude: {event.details.magnitude}</span>
              </div>
            )}

            {event.details?.casualties && (
              <div className="flex items-center space-x-1">
                <span>👥</span>
                <span>Affected: {event.details.casualties}</span>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Component to fit map bounds
// Component to fit map bounds
const MapController: React.FC<{ events: any[] }> = ({ events }) => {
  const map = useMap()
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 250)
    if (events.length > 0) {
      const bounds = events
        .filter(event => event.coordinates)
        .map(event => [event.coordinates[0], event.coordinates[1]] as [number, number])
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
    return () => clearTimeout(timer)
  }, [events, map])
  
  return null
}

const CrisisMap: React.FC<CrisisMapProps> = ({ height = '400px' }) => {
  const { crisisEvents } = useAppStore()
  
  // Filter events with coordinates
  const mapEvents = crisisEvents.filter(event => event.coordinates)
  
  // Default center (Indonesia/Southeast Asia)
  const defaultCenter: [number, number] = [-2.5, 118.0]
  const defaultZoom = mapEvents.length > 0 ? 6 : 5

  return (
    <div className="w-full rounded-lg overflow-hidden border relative" style={{ height, minHeight: '400px' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mapEvents.map((event, index) => (
          <CrisisMarker key={event.id || index} event={event} />
        ))}
        
        <MapController events={mapEvents} />
      </MapContainer>
      
      {mapEvents.length === 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-lg">No crisis events with location data</p>
            <p className="text-sm opacity-75 mt-1">Events will appear here when location data is available</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CrisisMap