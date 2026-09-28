'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Message = {
  role: 'user' | 'ai'
  text: string
  time: string
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
      }
    }
    init()
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', text: input, time: formatTime() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://127.0.0.1:8000/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text }),
      })

      if (!res.ok) throw new Error('Failed to get a response')

      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'ai', text: data.answer, time: formatTime() }])
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  return (
    <div className="container-wide" style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ marginBottom: 0 }}>AI Assistant</h1>
        <button onClick={handleClear} className="btn-secondary">
          Clear chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {messages.length === 0 && (
          <p className="empty-state">Ask me anything about your subjects, concepts, or exam prep.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={m.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
              {m.text}
            </div>
            <span className="bubble-meta">{m.time}</span>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className="bubble-ai">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          type="text"
          className="input"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn" style={{ width: 'auto' }} disabled={loading}>
          Send
        </button>
      </form>
    </div>
  )
}