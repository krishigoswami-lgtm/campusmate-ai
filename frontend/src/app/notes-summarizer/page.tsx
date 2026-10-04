'use client'

import { useState } from 'react'

type SummaryResult = {
  summary: string
  key_points: string[]
  key_terms: string[]
}

export default function NotesSummarizerPage() {
  const [content, setContent] = useState('')
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const summarize = async () => {
    if (!content.trim()) {
      setError('Please paste some notes first.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Unable to summarize. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-wide">
      <h1>AI Notes Summarizer</h1>
      <p className="card-meta" style={{ marginBottom: '1.5rem' }}>
        Paste your notes and get a quick summary, key points, and important terms.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <h2>Original Notes</h2>
          <textarea
            className="input"
            rows={14}
            placeholder="Paste your notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ resize: 'vertical' }}
          />
          {error && <p className="error-text">{error}</p>}
          <button className="btn" style={{ width: 'auto' }} onClick={summarize} disabled={loading}>
            {loading ? 'Summarizing...' : 'Summarize'}
          </button>
        </div>

        <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <h2>AI Summary</h2>
          {!result ? (
            <p className="empty-state">Your summary will appear here.</p>
          ) : (
            <>
              <p style={{ marginBottom: '1rem' }}>{result.summary}</p>
              <div className="card-title" style={{ marginBottom: '0.5rem' }}>Key Points</div>
              <ul style={{ paddingLeft: '1.2rem', marginBottom: '1rem' }}>
                {result.key_points.map((p, i) => (
                  <li key={i} className="card-meta" style={{ marginBottom: '0.3rem' }}>{p}</li>
                ))}
              </ul>
              <div className="card-title" style={{ marginBottom: '0.5rem' }}>Key Terms</div>
              <div>
                {result.key_terms.map((t, i) => (
                  <span key={i} className="badge badge-pending" style={{ marginRight: '0.4rem', marginBottom: '0.4rem', display: 'inline-block' }}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}