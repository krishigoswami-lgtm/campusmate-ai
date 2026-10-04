'use client'

import { useState, useRef, useEffect } from 'react'

type VivaTurn = {
  question: string
  answer: string
}

export default function VivaPrepPage() {
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [history, setHistory] = useState<VivaTurn[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentFeedback, setCurrentFeedback] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, currentQuestion])

  const callViva = async (newHistory: VivaTurn[]) => {
    const res = await fetch('http://127.0.0.1:8000/ai/viva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, difficulty, history: newHistory }),
    })
    if (!res.ok) throw new Error('Failed to get a response')
    return res.json()
  }

  const startViva = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await callViva([])
      setCurrentQuestion(data.next_question)
      setCurrentFeedback(null)
      setStarted(true)
    } catch {
      setError('Unable to start the viva. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return
    setError('')
    setLoading(true)

    const newHistory = [...history, { question: currentQuestion, answer }]

    try {
      const data = await callViva(newHistory)
      setHistory(newHistory)
      setCurrentFeedback(data.feedback)
      setCurrentQuestion(data.next_question)
      setAnswer('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const endViva = () => {
    setStarted(false)
    setHistory([])
    setCurrentQuestion('')
    setCurrentFeedback(null)
    setAnswer('')
  }

  if (!started) {
    return (
      <div className="container-wide">
        <h1>AI Viva Prep</h1>
        <p className="card-meta" style={{ marginBottom: '1.5rem' }}>
          Practice an oral exam with an AI examiner, one question at a time.
        </p>

        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <h2>Setup</h2>
          <div className="field">
            <label>Topic</label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Operating Systems"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Difficulty</label>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" style={{ width: 'auto' }} onClick={startViva} disabled={loading}>
            {loading ? 'Starting...' : 'Start Viva'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-wide" style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ marginBottom: 0 }}>Viva: {topic}</h1>
        <button onClick={endViva} className="btn-secondary">
          End session
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {history.map((turn, i) => (
          <div key={i} style={{ marginBottom: '1rem' }}>
            <span className="badge badge-pending" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
              Question {i + 1}
            </span>
            <div className="bubble-ai">{turn.question}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div className="bubble-user">{turn.answer}</div>
            </div>
          </div>
        ))}

        {currentFeedback && (
          <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch', background: 'var(--color-surface-container)', marginBottom: '1rem' }}>
            <div className="card-title">Examiner feedback</div>
            <p className="card-meta">{currentFeedback}</p>
          </div>
        )}

        <span className="badge badge-pending" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
          Question {history.length + 1}
        </span>
        <div className="bubble-ai">{currentQuestion}</div>

        <div ref={bottomRef} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          type="text"
          className="input"
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
        />
        <button className="btn" style={{ width: 'auto' }} onClick={submitAnswer} disabled={loading}>
          {loading ? '...' : 'Submit'}
        </button>
      </div>
    </div>
  )
}