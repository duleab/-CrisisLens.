import { useState, useRef, useEffect } from 'react'
import { askChat } from '../api'
import type { Role } from '../components/Sidebar'

const ROLE_CONFIG: Record<Role, {
  icon: string; color: string; btnColor: string;
  name: string; welcomeMsg: string; suggestions: string[]
}> = {
  citizen: {
    icon: '👥', color: 'bg-blue-600', btnColor: 'bg-blue-600 hover:bg-blue-700', name: 'Citizen',
    welcomeMsg: 'I can help you understand current crisis situations and safety procedures. What would you like to know?',
    suggestions: ['Is it safe in my area right now?', 'Where are the nearest shelters?', 'What should I do during an earthquake?'],
  },
  tourist: {
    icon: '✈️', color: 'bg-emerald-600', btnColor: 'bg-emerald-600 hover:bg-emerald-700', name: 'Tourist',
    welcomeMsg: 'I can help you stay safe during your travels. Ask me about current risks, evacuation routes, or emergency contacts.',
    suggestions: ['Is Bali safe to visit right now?', 'What are emergency numbers in Indonesia?', 'Are there any active volcano alerts?'],
  },
  responder: {
    icon: '🚑', color: 'bg-red-600', btnColor: 'bg-red-600 hover:bg-red-700', name: 'Responder',
    welcomeMsg: 'Full tactical data available. Query current incidents, severity levels, and resource requirements.',
    suggestions: ['Give me a full status report on critical incidents', 'Which locations have the highest earthquake magnitude?', 'What resources are needed in high-severity areas?'],
  },
  government: {
    icon: '🏛️', color: 'bg-indigo-600', btnColor: 'bg-indigo-600 hover:bg-indigo-700', name: 'Government',
    welcomeMsg: 'Strategic crisis intelligence ready. I can provide event summaries, resource implications, and risk assessments.',
    suggestions: ['Provide a strategic overview of current crises', 'Which regions require emergency resource allocation?', 'Generate a situation report for the last 24 hours'],
  },
}

interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
  time: Date
  aiRole?: Role
  eventsConsidered?: number
}

interface Props {
  darkMode: boolean
  initialRole?: Role
}

export default function AssistantPage({ darkMode, initialRole = 'government' }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeRole, setActiveRole] = useState<Role>(initialRole)
  const bottomRef = useRef<HTMLDivElement>(null)

  const cfg = ROLE_CONFIG[activeRole]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(text?: string) {
    const question = (text ?? input).trim()
    if (!question) return
    setInput('')
    
    setMessages(m => [...m, { id: Date.now().toString(), role: 'user', text: question, time: new Date() }])
    setLoading(true)
    
    try {
      const { answer, events_considered } = await askChat(question, activeRole)
      setMessages(m => [...m, { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: answer, 
        time: new Date(),
        aiRole: activeRole,
        eventsConsidered: events_considered
      }])
    } catch (e) {
      setMessages(m => [...m, { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: `⚠️ Request failed: ${e}`, 
        time: new Date(),
        aiRole: activeRole
      }])
    } finally {
      setLoading(false)
    }
  }

  const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex flex-col h-full w-full mx-auto p-4 md:p-6 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Role Selector Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 flex-shrink-0">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>CrisisLens AI Assistant</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Ask natural language questions about ongoing crises. Switch roles to change the assistant's perspective.
          </p>
        </div>
        
        <div className={`flex p-1 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          {(Object.keys(ROLE_CONFIG) as Role[]).map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeRole === role 
                  ? `${ROLE_CONFIG[role].color} text-white shadow-sm` 
                  : `${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              <span>{ROLE_CONFIG[role].icon}</span>
              <span className="hidden sm:inline">{ROLE_CONFIG[role].name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className={`flex-1 flex flex-col min-h-0 rounded-2xl border shadow-sm overflow-hidden ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-6 fade-in">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg ${cfg.color} text-white mb-2`}>
                {cfg.icon}
              </div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {cfg.name} Mode Active
              </h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                {cfg.welcomeMsg}
              </p>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === 'user'
            const msgCfg = isUser ? null : ROLE_CONFIG[m.aiRole || 'government']
            
            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} slide-in-right`}>
                {!isUser && msgCfg && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-1 shadow-sm ${msgCfg.color}`}>
                    {msgCfg.icon}
                  </div>
                )}
                
                <div className={`max-w-[75%]`}>
                  {!isUser && msgCfg && (
                    <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {msgCfg.name} Assistant
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                    isUser
                      ? `bg-blue-600 text-white rounded-tr-sm`
                      : darkMode
                        ? 'bg-gray-700 text-gray-100 rounded-tl-sm border border-gray-600'
                        : 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'
                  }`}>
                    {m.text}
                  </div>
                  
                  <div className={`flex items-center gap-3 mt-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {fmtTime(m.time)}
                    </div>
                    
                    {!isUser && m.eventsConsidered !== undefined && (
                      <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Grounded on {m.eventsConsidered} event{m.eventsConsidered !== 1 && 's'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-1 shadow-sm ${cfg.color}`}>
                {cfg.icon}
              </div>
              <div>
                <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {cfg.name} Assistant
                </div>
                <div className={`rounded-2xl rounded-tl-sm px-5 py-3.5 flex gap-1.5 shadow-sm border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'
                }`}>
                  <span className={`w-2 h-2 rounded-full typing-dot ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0ms' }} />
                  <span className={`w-2 h-2 rounded-full typing-dot ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '150ms' }} />
                  <span className={`w-2 h-2 rounded-full typing-dot ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested Chips */}
        <div className={`px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
          {cfg.suggestions.map(s => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={loading}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
              } disabled:opacity-50`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className={`p-4 bg-transparent`}>
          <div className={`flex gap-3 items-end rounded-xl border p-2 shadow-sm focus-within:ring-2 focus-within:ring-opacity-50 ${
            darkMode ? 'bg-gray-900 border-gray-700 focus-within:ring-gray-600' : 'bg-white border-gray-300 focus-within:ring-blue-500'
          }`}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Ask the ${cfg.name} Assistant...`}
              className={`flex-1 bg-transparent px-3 py-2 text-[15px] outline-none resize-none max-h-32 min-h-[44px] ${
                darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className={`${cfg.btnColor} disabled:opacity-40 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-all h-[44px]`}
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
