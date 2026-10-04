'use client'

import { useState } from 'react'

export default function ExplainMistakePage() {
  const [question, setQuestion] = useState('')
  const [wrongAnswer, setWrongAnswer] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const explain = async () => {
    if (!question.trim() || !wrongAnswer.trim() || !correctAnswer.trim()) {
      setError('Please fill in all three fields.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/ai/explain-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, wrong_answer: wrongAnswer, correct_answer: correctAnswer }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setExplanation(data.explanation)
    } catch {
      setError('Unable to get an explanation. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-wide">
      <h1>AI Explain My Mistake</h1>
      <p className="card-meta" style={{ marginBottom: '1.5rem' }}>
        Paste a question you got wrong, and get a simple explanation.
      </p>

      <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '1.5rem' }}>
        <div className="field">
          <label>Question</label>
          <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <div className="field">
          <label style={{ color: 'var(--color-danger)' }}>Your answer (incorrect)</label>
          <input className="input" value={wrongAnswer} onChange={(e) => setWrongAnswer(e.target.value)} />
        </div>
        <div className="field">
          <label style={{ color: 'var(--color-success)' }}>Correct answer</label>
          <input className="input" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn" style={{ width: 'auto' }} onClick={explain} disabled={loading}>
          {loading ? 'Thinking...' : 'Explain My Mistake'}
        </button>
      </div>

      {explanation && (
        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <h2>Explanation</h2>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  )
}