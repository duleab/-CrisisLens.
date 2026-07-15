// ======================================================================
// CrisisLens Interactive Crisis Map Component
// ======================================================================
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  Slider, Chip, IconButton, Tooltip, Card, CardContent, Button
} from '@mui/material';
import { 
  MyLocation, FilterList, Refresh, Fullscreen, 
  Warning, Info, LocationOn 
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { LatLngBounds, Icon, DivIcon } from 'leaflet';
import { CrisisEvent, AgentRole } from '../../types/crisis';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const createCustomIcon = (color: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  const sizes = { small: 20, medium: 25, large: 30 };
  return new DivIcon({
    html: `
      <div style="
        background: ${color}; 
        width: ${sizes[size]}px; 
        height: ${sizes[size]}px; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        ⚠
      </div>
    `,
    className: 'custom-marker',
    iconSize: [sizes[size], sizes[size]],
    iconAnchor: [sizes[size]/2, sizes[size]/2]
  });
};

const severityColors = {
  critical: '#D32F2F',  // Red
  high: '#FF8F00',      // Orange  
  medium: '#FBC02D',    // Yellow
  low: '#388E3C'        // Green
};

const severityIcons = {
  critical: createCustomIcon(severityColors.critical, 'large'),
  high: createCustomIcon(severityColors.high, 'medium'),
  medium: createCustomIcon(severityColors.medium, 'medium'), 
  low: createCustomIcon(severityColors.low, 'small')
};

interface CrisisMapProps {
  events: CrisisEvent[];
  filters: {
    severity: string;
    crisisType: string;
    timeRange: number;
  };
  onFiltersChange: (filters: any) => void;
  agentRole: AgentRole;
  height?: string;
}

// Map bounds updater component
const MapBoundsUpdater: React.FC<{ events: CrisisEvent[] }> = ({ events }) => {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    if (events.length > 0) {
      const validEvents = events.filter(e => e.latitude && e.longitude);
      
      if (validEvents.length === 1) {
        // Single event - center on it
        const event = validEvents[0];
        map.setView([event.latitude!, event.longitude!], 10);
      } else if (validEvents.length > 1) {
        // Multiple events - fit bounds
        const bounds = new LatLngBounds(
          validEvents.map(event => [event.latitude!, event.longitude!])
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
    return () => clearTimeout(timer);
  }, [events, map]);
  
  return null;
};

export const CrisisMap: React.FC<CrisisMapProps> = ({
  events,
  filters,
  onFiltersChange,
  agentRole,
  height = '500px'
}) => {
  const mapRef = useRef<L.Map>(null);
  const [selectedEvent, setSelectedEvent] = useState<CrisisEvent | null>(null);
  const [mapCenter] = useState<[number, number]>([-2.5, 118.0]); // Indonesia center
  const [mapZoom] = useState(5);

  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    if (filters.severity !== 'all' && event.severity !== filters.severity) {
      return false;
    }
    if (filters.crisisType !== 'all' && event.crisis_type !== filters.crisisType) {
      return false;
    }
    // Time range filtering would be done on API level
    return event.latitude && event.longitude; // Only events with coordinates
  });

  // Get unique crisis types for filter dropdown
  const crisisTypes = Array.from(new Set(events.map(e => e.crisis_type)));

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.setView([latitude, longitude], 12);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const getAgentSpecificPopupContent = (event: CrisisEvent) => {
    const baseInfo = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: ${severityColors[event.severity]};">
          ${event.crisis_type.toUpperCase()} - ${event.severity.toUpperCase()}
        </h3>
        <p style="margin: 4px 0;"><strong>Location:</strong> ${event.location_name || 'Unknown'}</p>
        <p style="margin: 4px 0;"><strong>Confidence:</strong> ${(event.confidence * 100).toFixed(0)}%</p>
        <p style="margin: 4px 0;"><strong>Source:</strong> ${event.source_name}</p>
        ${event.casualties ? `<p style="margin: 4px 0;"><strong>Casualties:</strong> ${event.casualties}</p>` : ''}
        ${event.magnitude ? `<p style="margin: 4px 0;"><strong>Magnitude:</strong> ${event.magnitude}</p>` : ''}
    `;

    // Agent-specific recommendations
    const agentAdvice: Record<AgentRole, string> = {
      citizen: `
        <div style="background: #E3F2FD; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <strong>👥 For Citizens:</strong><br/>
          ${event.severity === 'critical' || event.severity === 'high' 
            ? '⚠️ Avoid this area. Follow evacuation orders if issued.'
            : '💡 Monitor situation. Prepare emergency supplies.'}
        </div>
      `,
      tourist: `
        <div style="background: #FFF3E0; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <strong>✈️ For Tourists:</strong><br/>
          ${event.severity === 'critical' || event.severity === 'high'
            ? '🚫 Cancel travel plans to this area. Contact your embassy.'
            : '⚠️ Monitor travel advisories. Consider alternative routes.'}
        </div>
      `,
      responder: `
        <div style="background: #FFEBEE; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <strong>🚑 For Responders:</strong><br/>
          Priority Level: ${event.severity === 'critical' ? 'IMMEDIATE' : 
                          event.severity === 'high' ? 'HIGH' : 'MONITOR'}<br/>
          Estimated affected: ${event.casualties || 'Unknown'}
        </div>
      `,
      government: `
        <div style="background: #F3E5F5; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <strong>🏛️ Government Action:</strong><br/>
          ${event.severity === 'critical' ? '🔴 Coordinate emergency response'
            : event.severity === 'high' ? '🟡 Deploy local resources' 
            : '🟢 Monitor and assess'}
        </div>
      `,
      ngo: `
        <div style="background: #E8F5E8; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <strong>🤝 NGO Focus:</strong><br/>
          ${event.severity === 'critical' || event.severity === 'high'
            ? '🏠 Prepare shelters & supplies. Coordinate with authorities.'
            : '📋 Assess community needs. Prepare contingency plans.'}
        </div>
      `,
      media: `
        <div style="background: #F5F5F5; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <strong>📰 Media Guidelines:</strong><br/>
          Verified: ${event.trust_score > 0.9 ? '✅ High' : '⚠️ Moderate'}<br/>
          ${event.source_count > 1 ? `✅ ${event.source_count} sources confirm` : '⚠️ Single source'}
        </div>
      `,
      business: `
        <div style="background: #F1F8E9; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <strong>🏢 Business Impact:</strong><br/>
          ${event.severity === 'critical' || event.severity === 'high'
            ? '🔴 High disruption risk. Activate continuity plans.'
            : '🟡 Monitor operations. Prepare contingencies.'}
        </div>
      `
    };

    return baseInfo + (agentAdvice[agentRole] || '') + '</div>';
  };

  return (
    <Paper elevation={3} sx={{ height, position: 'relative' }}>
      {/* Map controls header */}
      <Box sx={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        right: 10, 
        zIndex: 1000,
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap'
      }}>
        {/* Filters */}
        <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white', borderRadius: 1 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={filters.severity}
            label="Severity"
            onChange={(e) => onFiltersChange({...filters, severity: e.target.value})}
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white', borderRadius: 1 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filters.crisisType}
            label="Type"
            onChange={(e) => onFiltersChange({...filters, crisisType: e.target.value})}
          >
            <MenuItem value="all">All Types</MenuItem>
            {crisisTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action buttons */}
        <Tooltip title="My Location">
          <IconButton 
            onClick={handleLocationClick}
            sx={{ bgcolor: 'white', borderRadius: 1 }}
            size="small"
          >
            <MyLocation />
          </IconButton>
        </Tooltip>

        {/* Event count indicator */}
        <Chip 
          icon={<LocationOn />}
          label={`${filteredEvents.length} Events`}
          color="primary"
          size="small"
          sx={{ bgcolor: 'white', color: 'primary.main' }}
        />

        {/* Severity distribution */}
        {Object.entries(severityColors).map(([severity, color]) => {
          const count = filteredEvents.filter(e => e.severity === severity).length;
          return count > 0 ? (
            <Chip
              key={severity}
              label={`${severity}: ${count}`}
              size="small"
              sx={{ 
                bgcolor: color, 
                color: 'white',
                '& .MuiChip-label': { fontWeight: 'bold' }
              }}
            />
          ) : null;
        })}
      </Box>

      {/* Map component */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        ref={mapRef}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Update map bounds when events change */}
        <MapBoundsUpdater events={filteredEvents} />

        {/* Crisis event markers with clustering */}
        <MarkerClusterGroup 
          chunkedLoading
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          maxClusterRadius={50}
        >
          {filteredEvents.map((event) => (
            <Marker
              key={event.id}
              position={[event.latitude!, event.longitude!]}
              icon={severityIcons[event.severity]}
              eventHandlers={{
                click: () => setSelectedEvent(event)
              }}
            >
              <Popup 
                maxWidth={300}
                className="crisis-popup"
              >
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: getAgentSpecificPopupContent(event) 
                  }}
                />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Map legend */}
      <Box sx={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        bgcolor: 'rgba(255,255,255,0.9)',
        p: 1,
        borderRadius: 1,
        zIndex: 1000
      }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
          Severity Levels
        </Typography>
        {Object.entries(severityColors).map(([severity, color]) => (
          <Box key={severity} sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                bgcolor: color, 
                borderRadius: '50%', 
                mr: 1 
              }}
            />
            <Typography variant="caption">
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Agent role indicator */}
      <Box sx={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        bgcolor: 'rgba(0,0,0,0.7)',
        color: 'white',
        p: 1,
        borderRadius: 1,
        zIndex: 1000
      }}>
        <Typography variant="caption">
          Viewing as: <strong>{agentRole.toUpperCase()}</strong>
        </Typography>
      </Box>
    </Paper>
  );
};