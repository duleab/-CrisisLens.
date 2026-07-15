import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'citizen' | 'government' | 'responder' | 'tourist'

export interface CrisisEvent {
  id: number
  type: string
  location: string
  country: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  verified: boolean
  timestamp: string
  source: string
  coordinates?: [number, number]
  details?: {
    magnitude?: number
    casualties?: number
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AppStore {
  // User state
  userRole: UserRole | null
  userLocation: string | null
  sessionId: string | null
  
  // Crisis data
  crisisEvents: CrisisEvent[]
  dashboardStats: {
    totalEvents: number
    highConfidence: number
    verified: number
    criticalEvents: number
  } | null
  
  // Chat state
  chatMessages: ChatMessage[]
  isChatOpen: boolean
  
  // WebSocket state
  isConnected: boolean
  connectionId: string | null
  
  // UI state
  selectedEvent: CrisisEvent | null
  mapBounds: any | null
  
  // Actions
  setUserRole: (role: UserRole) => void
  setUserLocation: (location: string) => void
  setSessionId: (id: string) => void
  setCrisisEvents: (events: CrisisEvent[]) => void
  setDashboardStats: (stats: any) => void
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void
  setChatOpen: (open: boolean) => void
  setConnected: (connected: boolean) => void
  setConnectionId: (id: string | null) => void
  setSelectedEvent: (event: CrisisEvent | null) => void
  setMapBounds: (bounds: any) => void
  reset: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      userRole: null,
      userLocation: null,
      sessionId: null,
      crisisEvents: [],
      dashboardStats: null,
      chatMessages: [],
      isChatOpen: false,
      isConnected: false,
      connectionId: null,
      selectedEvent: null,
      mapBounds: null,
      
      // Actions
      setUserRole: (role) => set({ userRole: role }),
      setUserLocation: (location) => set({ userLocation: location }),
      setSessionId: (id) => set({ sessionId: id }),
      setCrisisEvents: (events) => set({ crisisEvents: events }),
      setDashboardStats: (stats) => set({ dashboardStats: stats }),
      
      addChatMessage: (message) => set((state) => ({
        chatMessages: [...state.chatMessages, message]
      })),
      
      clearChatMessages: () => set({ chatMessages: [] }),
      setChatOpen: (open) => set({ isChatOpen: open }),
      setConnected: (connected) => set({ isConnected: connected }),
      setConnectionId: (id) => set({ connectionId: id }),
      setSelectedEvent: (event) => set({ selectedEvent: event }),
      setMapBounds: (bounds) => set({ mapBounds: bounds }),
      
      reset: () => set({
        userRole: null,
        userLocation: null,
        sessionId: null,
        crisisEvents: [],
        dashboardStats: null,
        chatMessages: [],
        isChatOpen: false,
        isConnected: false,
        connectionId: null,
        selectedEvent: null,
        mapBounds: null,
      }),
    }),
    {
      name: 'crisislens-storage',
      partialize: (state) => ({
        userRole: state.userRole,
        userLocation: state.userLocation,
        sessionId: state.sessionId,
      }),
    }
  )
)