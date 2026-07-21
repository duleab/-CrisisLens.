import { useState, useRef, useEffect } from 'react'
import { askChat } from '../api'
import type { Role } from './Sidebar'

const ROLE_CONFIG: Record<Role, {
  icon: string; color: string; btnColor: string;
  welcomeTitle: string; welcomeMsg: string; suggestions: string[]
}> = {
  citizen: {
    icon: '👥', color: 'bg-blue-600', btnColor: 'bg-blue-600 hover:bg-blue-700',
    welcomeTitle: 'Stay Informed, Stay Safe',
    welcomeMsg: 'I can help you understand current crisis situations and safety procedures. What would you like to know?',
    suggestions: [
      'Is it safe in my area right now?',
      'Where are the nearest shelters?',
      'What should I do during an earthquake?',
    ],
  },
  tourist: {
    icon: '✈️', color: 'bg-emerald-600', btnColor: 'bg-emerald-600 hover:bg-emerald-700',
    welcomeTitle: 'Travel Safety Assistant',
    welcomeMsg: 'I can help you stay safe during your travels. Ask me about current risks, evacuation routes, or emergency contacts.',
    suggestions: [
      'Is Bali safe to visit right now?',
      'What are emergency numbers in Indonesia?',
      'Are there any active volcano alerts?',
    ],
  },
  responder: {
    icon: '🚑', color: 'bg-red-600', btnColor: 'bg-red-600 hover:bg-red-700',
    welcomeTitle: 'Responder Intelligence Hub',
    welcomeMsg: 'Full tactical data available. Query current incidents, severity levels, and resource requirements.',
    suggestions: [
      'Give me a full status report on critical incidents',
      'Which locations have the highest earthquake magnitude?',
      'What resources are needed in high-severity areas?',
    ],
  },
  government: {
    icon: '🏛️', color: 'bg-indigo-600', btnColor: 'bg-indigo-600 hover:bg-indigo-700',
    welcomeTitle: 'Government Intelligence Brief',
    welcomeMsg: 'Strategic crisis intelligence ready. I can provide event summaries, resource implications, and risk assessments.',
    suggestions: [
      'Provide a strategic overview of current crises',
      'Which regions require emergency resource allocation?',
      'Generate a situation report for the last 24 hours',
    ],
  },
}

interface Message {
  role: 'user' | 'ai'
  text: string
  time: Date
}

interface Props {
  selectedRole: Role
  darkMode: boolean
}

export default function ChatPanel({ selectedRole, darkMode }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const cfg = ROLE_CONFIG[selectedRole]

  useEffect(() => {
    // Reset when role changes
    setMessages([])
  }, [selectedRole])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(text?: string) {
    const question = (text ?? input).trim()
    if (!question) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: question, time: new Date() }])
    setLoading(true)
    try {
      const { answer } = await askChat(question, selectedRole)
      setMessages(m => [...m, { role: 'ai', text: answer, time: new Date() }])
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: `⚠️ Request failed: ${e}`, time: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex flex-col h-full rounded-2xl border overflow-hidden ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center gap-3 ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div>
          <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            CrisisLens AI Assistant
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} mode
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 live-dot" />
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Welcome card (shown when no messages) */}
        {messages.length === 0 && (
          <div className={`rounded-xl p-4 border ${
            darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-100'
          } fade-in`}>
            <div className={`font-semibold text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {cfg.welcomeTitle}
            </div>
            <div className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {cfg.welcomeMsg}
            </div>
            <div className="space-y-1.5">
              {cfg.suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all ${
                    darkMode
                      ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  💬 {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'} slide-in-right`}>
            {m.role === 'ai' && (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-1 ${cfg.color}`}>
                🤖
              </div>
            )}
            <div className={`max-w-[80%]`}>
              <div className={`rounded-2xl px-3 py-2 text-sm ${
                m.role === 'user'
                  ? `${cfg.color} text-white rounded-tr-sm`
                  : darkMode
                    ? 'bg-gray-700 text-gray-200 rounded-tl-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {m.text}
              </div>
              <div className={`text-xs mt-0.5 ${m.role === 'user' ? 'text-right' : ''} ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {fmtTime(m.time)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2 items-start">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 ${cfg.color}`}>
              🤖
            </div>
            <div className={`rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <span className={`w-2 h-2 rounded-full typing-dot ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} />
              <span className={`w-2 h-2 rounded-full typing-dot ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} />
              <span className={`w-2 h-2 rounded-full typing-dot ${darkMode ? 'bg-gray-400' : 'bg-gray-500'}`} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`flex gap-2 rounded-xl border p-1 ${
          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about the current crisis situation..."
            className={`flex-1 bg-transparent px-3 py-2 text-sm outline-none ${
              darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
            }`}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className={`${cfg.btnColor} disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
