'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
}

type Exam = {
  id: string
  exam_name: string
  exam_type: string
  exam_date: string
  exam_time: string | null
  room: string | null
  subject_id: string | null
}

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [examName, setExamName] = useState('')
  const [examType, setExamType] = useState('internal')
  const [examDate, setExamDate] = useState('')
  const [examTime, setExamTime] = useState('')
  const [room, setRoom] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadData = async () => {
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('*')
      .order('exam_date', { ascending: true })

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name')

    if (examError) {
      setError(examError.message)
    } else {
      setExams(examData ?? [])
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

    const { error } = await supabase.from('exams').insert({
      exam_name: examName,
      exam_type: examType,
      exam_date: examDate,
      exam_time: examTime || null,
      room: room || null,
      subject_id: subjectId || null,
      user_id: userData.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setExamName('')
      setExamType('internal')
      setExamDate('')
      setExamTime('')
      setRoom('')
      setSubjectId('')
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('exams').delete().eq('id', id)
    loadData()
  }

  const getSubjectName = (id: string | null) => {
    if (!id) return null
    return subjects.find((s) => s.id === id)?.name
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date(new Date().toDateString())
  }

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Exams</h1>

      <form onSubmit={handleAdd} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Exam name</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Data Structures Mid-Sem"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label>Subject (optional)</label>
            <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">None</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Exam type</label>
            <select className="input" value={examType} onChange={(e) => setExamType(e.target.value)}>
              <option value="internal">Internal</option>
              <option value="mid-semester">Mid-Semester</option>
              <option value="practical">Practical</option>
              <option value="end-semester">End-Semester</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              className="input"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Time (optional)</label>
            <input
              type="time"
              className="input"
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
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
          Add Exam
        </button>
      </form>

      <h2>Your Exams</h2>
      {exams.length === 0 ? (
        <p className="empty-state">No exams added yet.</p>
      ) : (
        <div>
          {exams.map((ex) => (
            <div key={ex.id} className="card">
              <div>
                <div className="card-title">{ex.exam_name}</div>
                <div className="card-meta">
                  {getSubjectName(ex.subject_id) && <span>{getSubjectName(ex.subject_id)} - </span>}
                  <span className="badge badge-pending">{ex.exam_type}</span>
                  {' '}
                  {ex.exam_date}
                  {ex.exam_time && <span> at {ex.exam_time}</span>}
                  {ex.room && <span> - Room {ex.room}</span>}
                  {isUpcoming(ex.exam_date) && (
                    <span className="badge badge-high" style={{ marginLeft: '0.5rem' }}>Upcoming</span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(ex.id)} className="btn-secondary">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
