'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
}

type AttendanceRecord = {
  id: string
  subject_id: string
  date: string
  status: string
}

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('present')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadData = async () => {
    const { data: recordData, error: recordError } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false })

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name')

    if (recordError) {
      setError(recordError.message)
    } else {
      setRecords(recordData ?? [])
    }
    setSubjects(subjectData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
        return
      }
      loadData()
    }
    init()
  }, [router])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    if (!subjectId) {
      setError('Please select a subject')
      return
    }

    const { error } = await supabase.from('attendance').insert({
      subject_id: subjectId,
      date,
      status,
      user_id: userData.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setDate('')
      setStatus('present')
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('attendance').delete().eq('id', id)
    loadData()
  }

  const getSubjectName = (id: string) => {
    return subjects.find((s) => s.id === id)?.name ?? 'Unknown'
  }

  const getStats = (subjectId: string) => {
    const subjectRecords = records.filter((r) => r.subject_id === subjectId)
    const total = subjectRecords.length
    const present = subjectRecords.filter((r) => r.status === 'present').length
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100)
    return { total, present, percentage }
  }

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Attendance</h1>

      <form onSubmit={handleAdd} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Subject</label>
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
            <option value="">Select a subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn" style={{ width: 'auto' }}>
          Add Record
        </button>
      </form>

      <h2>Attendance Summary</h2>
      <div style={{ marginBottom: '2rem' }}>
        {subjects.map((s) => {
          const stats = getStats(s.id)
          if (stats.total === 0) return null
          const isLow = stats.percentage < 75
          return (
            <div key={s.id} className="card">
              <div>
                <div className="card-title">{s.name}</div>
                <div className="card-meta">
                  {stats.present} / {stats.total} classes attended
                </div>
              </div>
              <span className={isLow ? 'badge badge-high' : 'badge badge-completed'}>
                {stats.percentage}%
              </span>
            </div>
          )
        })}
        {subjects.every((s) => getStats(s.id).total === 0) && (
          <p className="empty-state">No attendance records yet.</p>
        )}
      </div>

      <h2>Recent Records</h2>
      {records.length === 0 ? (
        <p className="empty-state">No records added yet.</p>
      ) : (
        <div>
          {records.map((r) => (
            <div key={r.id} className="card">
              <div>
                <div className="card-title">{getSubjectName(r.subject_id)}</div>
                <div className="card-meta">
                  {r.date} - <span className={r.status === 'present' ? 'badge badge-completed' : 'badge badge-high'}>{r.status}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(r.id)} className="btn-secondary">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
