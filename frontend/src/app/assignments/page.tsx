'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
}

type Assignment = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  priority: string
  status: string
  subject_id: string | null
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [subjectId, setSubjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadData = async () => {
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .order('due_date', { ascending: true })

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name')

    if (assignmentError) {
      setError(assignmentError.message)
    } else {
      setAssignments(assignmentData ?? [])
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

    const { error } = await supabase.from('assignments').insert({
      title,
      description: description || null,
      due_date: dueDate || null,
      priority,
      subject_id: subjectId || null,
      status: 'pending',
      user_id: userData.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('medium')
      setSubjectId('')
      loadData()
    }
  }

  const handleToggleComplete = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    await supabase.from('assignments').update({ status: newStatus }).eq('id', id)
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('assignments').delete().eq('id', id)
    loadData()
  }

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return null
    return subjects.find((s) => s.id === subjectId)?.name
  }

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Assignments</h1>

      <form onSubmit={handleAdd} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Assignment 1 - Sorting Algorithms"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Description (optional)</label>
          <input
            type="text"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label>Due date</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Priority</label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Subject (optional)</label>
          <select
            className="input"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">None</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn" style={{ width: 'auto' }}>
          Add Assignment
        </button>
      </form>

      <h2>Your Assignments</h2>
      {assignments.length === 0 ? (
        <p className="empty-state">No assignments added yet.</p>
      ) : (
        <div>
          {assignments.map((a) => (
            <div key={a.id} className="card">
              <div>
                <div className="card-title" style={{ textDecoration: a.status === 'completed' ? 'line-through' : 'none' }}>
                  {a.title}
                </div>
                <div className="card-meta">
                  {getSubjectName(a.subject_id) && <span>{getSubjectName(a.subject_id)} - </span>}
                  {a.due_date && <span>Due {a.due_date} - </span>}
                  <span className={`badge badge-${a.priority}`}>{a.priority}</span>
                  {' '}
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleToggleComplete(a.id, a.status)} className="btn-secondary" style={{ color: 'var(--color-success)' }}>
                  {a.status === 'completed' ? 'Undo' : 'Complete'}
                </button>
                <button onClick={() => handleDelete(a.id)} className="btn-secondary">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
