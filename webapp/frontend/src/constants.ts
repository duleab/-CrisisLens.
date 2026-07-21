import {
  Activity,
  Flame,
  Mountain,
  HeartPulse,
  Droplet,
  CloudLightning,
  TriangleAlert,
  Waves,
  Crosshair,
  Factory,
  HeartHandshake,
  Info,
  HelpCircle
} from 'lucide-react'

export interface SeverityConfig {
  color: string
  label: string
  pulse: boolean
  glow: boolean
  border: string
  boxShadow: string
}

const critStyle: SeverityConfig = {
  color: '#dc2626',
  label: 'CRITICAL',
  pulse: true,
  glow: true,
  border: '4px solid #ffffff',
  boxShadow: '0 0 20px rgba(220,38,38,0.75)',
}

const highStyle: SeverityConfig = {
  color: '#f97316',
  label: 'HIGH',
  pulse: false,
  glow: true,
  border: '3px solid #ffffff',
  boxShadow: '0 0 16px rgba(249,115,22,0.7)',
}

const medStyle: SeverityConfig = {
  color: '#facc15',
  label: 'MEDIUM',
  pulse: false,
  glow: false,
  border: '3px solid #ffffff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
}

const lowStyle: SeverityConfig = {
  color: '#22c55e',
  label: 'LOW',
  pulse: false,
  glow: false,
  border: '3px solid #ffffff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
}

const infoStyle: SeverityConfig = {
  color: '#3b82f6',
  label: 'INFO',
  pulse: false,
  glow: false,
  border: '3px solid #ffffff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
}

export const SEVERITY_STYLE: Record<string, SeverityConfig> = {
  critical: critStyle,
  high: highStyle,
  medium: medStyle,
  low: lowStyle,
  info: infoStyle,
  // Casing variations for safe direct lookup
  CRITICAL: critStyle,
  HIGH: highStyle,
  MEDIUM: medStyle,
  LOW: lowStyle,
  INFO: infoStyle,
  Critical: critStyle,
  High: highStyle,
  Medium: medStyle,
  Low: lowStyle,
  Info: infoStyle,
}

export function getSeverityStyle(sev?: string): SeverityConfig {
  if (!sev) return lowStyle
  const clean = sev.toLowerCase().trim()
  return SEVERITY_STYLE[clean] || SEVERITY_STYLE[sev] || lowStyle
}

export const CRISIS_ICON: Record<string, any> = {
  earthquake: Activity,
  wildfire: Flame,
  volcano: Mountain,
  disease: HeartPulse,
  flood: Droplet,
  storm: CloudLightning,
  cyclone: CloudLightning,
  typhoon: CloudLightning,
  landslide: TriangleAlert,
  tsunami: Waves,
  conflict: Crosshair,
  industrial: Factory,
  humanitarian: HeartHandshake,
  other: Info,
  // Uppercase variations
  Earthquake: Activity,
  Wildfire: Flame,
  Volcano: Mountain,
  Disease: HeartPulse,
  Flood: Droplet,
  Storm: CloudLightning,
  Landslide: TriangleAlert,
  Tsunami: Waves,
  Conflict: Crosshair,
  Industrial: Factory,
  Humanitarian: HeartHandshake,
  Other: Info,
}

export const DEFAULT_ICON = HelpCircle

export function getCrisisIcon(type?: string): any {
  if (!type) return DEFAULT_ICON
  const t = type.toLowerCase().trim()
  if (t.includes('earthquake') || t.includes('seismic') || t.includes('quake')) return Activity
  if (t.includes('fire') || t.includes('wildfire')) return Flame
  if (t.includes('volcano') || t.includes('eruption') || t.includes('volcanic')) return Mountain
  if (t.includes('disease') || t.includes('virus') || t.includes('outbreak') || t.includes('health') || t.includes('epidemic')) return HeartPulse
  if (t.includes('flood') || t.includes('water') || t.includes('rain')) return Droplet
  if (t.includes('storm') || t.includes('cyclone') || t.includes('typhoon') || t.includes('hurricane') || t.includes('wind')) return CloudLightning
  if (t.includes('landslide') || t.includes('mudslide') || t.includes('avalanche')) return TriangleAlert
  if (t.includes('tsunami') || t.includes('wave')) return Waves
  if (t.includes('conflict') || t.includes('war') || t.includes('shooting') || t.includes('security')) return Crosshair
  if (t.includes('industrial') || t.includes('accident') || t.includes('chemical') || t.includes('factory')) return Factory
  if (t.includes('humanitarian') || t.includes('aid') || t.includes('refugee')) return HeartHandshake
  if (t.includes('other') || t.includes('info')) return Info
  return CRISIS_ICON[type] || CRISIS_ICON[t] || DEFAULT_ICON
}
