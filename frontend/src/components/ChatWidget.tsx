import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { chatApi } from '../lib/api'
import { getWebSocketManager } from '../lib/websocket'
import { formatRelativeTime, getRoleIcon } from '../lib/utils'
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Bot,
  User,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const ChatWidget: React.FC = () => {
  const {
    userRole,
    userLocation,
    sessionId,
    chatMessages,
    isChatOpen,
    addChatMessage,
    setChatOpen
  } = useAppStore()

  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load suggestions on role change
  useEffect(() => {
    if (userRole && isChatOpen && suggestions.length === 0) {
      chatApi.getSuggestions(userRole)
        .then(response => setSuggestions(response.data.suggestions))
        .catch(error => console.error('Failed to load suggestions:', error))
    }
  }, [userRole, isChatOpen, suggestions.length])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !sessionId || !userRole) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date().toISOString()
    }

    addChatMessage(userMessage)
    setInput('')
    setIsLoading(true)

    try {
      // Try WebSocket first
      const wsManager = getWebSocketManager()
      if (wsManager && wsManager.isConnected()) {
        wsManager.sendChatMessage(message, userRole)
      } else {
        // Fallback to API
        const response = await chatApi.sendMessage({
          message: message.trim(),
          user_role: userRole,
          session_id: sessionId,
          user_location: userLocation || undefined
        })

        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: response.data.timestamp
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      })
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
    setSuggestions([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(input)
  }

  if (!isChatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-40"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-80 h-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">
            CrisisLens AI {getRoleIcon(userRole || 'citizen')}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setChatOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content - hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto max-h-64">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  Hi! I'm your CrisisLens AI assistant.
                  <br />
                  Ask me about crisis events and safety guidance.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[85%] ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>
                      
                      <div className={`p-3 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 opacity-70 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatRelativeTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-gray-600" />
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && chatMessages.length === 0 && (
            <div className="px-4 py-2 border-t bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Suggested questions:</p>
              <div className="space-y-1">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded truncate"
                  >
                    💬 {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${userRole === 'citizen' ? 'safety' : userRole === 'government' ? 'coordination' : userRole === 'responder' ? 'operations' : 'travel'} guidance...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default ChatWidget