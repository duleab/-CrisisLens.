const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export interface CrisisEvent {
  id: string
  crisis_type: string
  severity: string
  system_confidence: number
  location_name: string | null
  country_iso: string | null
  latitude: number | null
  longitude: number | null
  magnitude: number | null
  casualties_estimated: number | null
  source_names: string[]
  official_confirmed: boolean
  raw_text: string | null
  event_date: string | null
}

export interface Stats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  verified: number
  by_type: Record<string, number>
  countries: number
  avg_confidence: number
}

export async function fetchEvents(limit = 200, region: 'sea' | 'world' = 'sea'): Promise<CrisisEvent[]> {
  const res = await fetch(`${API_BASE}/api/events?limit=${limit}&region=${region}`)
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`)
  return res.json()
}

export async function fetchStats(region: 'sea' | 'world' = 'sea'): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats?region=${region}`)
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`)
  return res.json()
}

export async function triggerIngest(): Promise<{ fetched: number; saved: number; skipped_duplicates: number }> {
  const res = await fetch(`${API_BASE}/api/ingest`, { method: 'POST' })
  if (!res.ok) throw new Error(`Ingest failed: ${res.status}`)
  return res.json()
}

export async function askChat(question: string, role: string, lang: string = 'en'): Promise<{ answer: string }> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, role, lang }),
  })
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
  return res.json()
}
