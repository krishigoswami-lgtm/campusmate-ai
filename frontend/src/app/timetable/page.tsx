'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
}

type ClassEntry = {
  id: string
  subject_id: string | null
  day_of_week: string
  start_time: string
  end_time: string
  room: string | null
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Timetable() {
  const [classes, setClasses] = useState<ClassEntry[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [room, setRoom] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadData = async () => {
    const { data: classData, error: classError } = await supabase
      .from('timetable')
      .select('*')
      .order('start_time', { ascending: true })

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name')

    if (classError) {
      setError(classError.message)
    } else {
      setClasses(classData ?? [])
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

    const { error } = await supabase.from('timetable').insert({
      subject_id: subjectId || null,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      room: room || null,
      user_id: userData.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setSubjectId('')
      setStartTime('')
      setEndTime('')
      setRoom('')
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('timetable').delete().eq('id', id)
    loadData()
  }

  const getSubjectName = (id: string | null) => {
    if (!id) return 'No subject'
    return subjects.find((s) => s.id === id)?.name ?? 'Unknown'
  }

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Timetable</h1>

      <form onSubmit={handleAdd} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Subject</label>
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">None</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Day</label>
          <select className="input" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label>Start time</label>
            <input
              type="time"
              className="input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>End time</label>
            <input
              type="time"
              className="input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="field">
          <label>Room (optional)</label>
          <input
            type="text"
            className="input"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn" style={{ width: 'auto' }}>
          Add Class
        </button>
      </form>

      {DAYS.map((day) => {
        const dayClasses = classes.filter((c) => c.day_of_week === day)
        if (dayClasses.length === 0) return null
        return (
          <div key={day} style={{ marginBottom: '1.5rem' }}>
            <h2>{day}</h2>
            {dayClasses.map((c) => (
              <div key={c.id} className="card">
                <div>
                  <div className="card-title">{getSubjectName(c.subject_id)}</div>
                  <div className="card-meta">
                    {c.start_time} - {c.end_time}
                    {c.room && <span> - Room {c.room}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="btn-secondary">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )
      })}

      {classes.length === 0 && <p className="empty-state">No classes added yet.</p>}
    </div>
  )
}
