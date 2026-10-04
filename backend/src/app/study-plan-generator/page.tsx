'use client'

import { useState } from 'react'

type Task = {
  subject: string
  task: string
}

type Day = {
  day_label: string
  tasks: Task[]
}

export default function StudyPlanGeneratorPage() {
  const [subjectsInput, setSubjectsInput] = useState('')
  const [examDate, setExamDate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState(3)

  const [plan, setPlan] = useState<Day[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generatePlan = async () => {
    const subjects = subjectsInput.split(',').map((s) => s.trim()).filter(Boolean)

    if (subjects.length === 0) {
      setError('Please enter at least one subject.')
      return
    }
    if (!examDate) {
      setError('Please pick an exam date.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://127.0.0.1:8000/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects, exam_date: examDate, hours_per_day: hoursPerDay }),
      })
      if (!res.ok) throw new Error('Failed to generate plan')
      const data = await res.json()
      setPlan(data.plan)
    } catch {
      setError('Unable to generate a study plan. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-wide">
      <h1>AI Study Plan Generator</h1>
      <p className="card-meta" style={{ marginBottom: '1.5rem' }}>
        Get a day-by-day study plan built around your subjects and exam date.
      </p>

      <div className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <h2>Plan Setup</h2>

        <div className="field">
          <label>Subjects (comma-separated)</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. Data Structures, Operating Systems"
            value={subjectsInput}
            onChange={(e) => setSubjectsInput(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label>Exam date</label>
            <input
              className="input"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Hours per day</label>
            <select className="input" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))}>
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
              <option value={5}>5+ hours</option>
            </select>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn" style={{ width: 'auto' }} onClick={generatePlan} disabled={loading}>
          {loading ? 'Generating Plan...' : 'Generate Study Plan'}
        </button>
      </div>

      {plan.length > 0 && (
        <>
          <h2>Your Plan</h2>
          {plan.map((day, i) => (
            <div key={i} className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="card-title">{day.day_label}</div>
              {day.tasks.map((t, j) => (
                <div key={j} style={{ marginTop: '0.5rem' }}>
                  <span className="badge badge-pending">{t.subject}</span>
                  <p className="card-meta" style={{ marginTop: '0.25rem' }}>{t.task}</p>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  )
}