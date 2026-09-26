'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
}

type StudyTask = {
  id: string
  task_name: string
  target_date: string | null
  status: string
  subject_id: string | null
}

export default function StudyPlanner() {
  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [taskName, setTaskName] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadData = async () => {
    const { data: taskData, error: taskError } = await supabase
      .from('study_tasks')
      .select('*')
      .order('target_date', { ascending: true })

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name')

    if (taskError) {
      setError(taskError.message)
    } else {
      setTasks(taskData ?? [])
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

    const { error } = await supabase.from('study_tasks').insert({
      task_name: taskName,
      target_date: targetDate || null,
      subject_id: subjectId || null,
      status: 'planned',
      user_id: userData.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setTaskName('')
      setTargetDate('')
      setSubjectId('')
      loadData()
    }
  }

  const cycleStatus = async (id: string, currentStatus: string) => {
    const next =
      currentStatus === 'planned' ? 'in progress' :
      currentStatus === 'in progress' ? 'completed' :
      'planned'
    await supabase.from('study_tasks').update({ status: next }).eq('id', id)
    loadData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('study_tasks').delete().eq('id', id)
    loadData()
  }

  const getSubjectName = (id: string | null) => {
    if (!id) return null
    return subjects.find((s) => s.id === id)?.name
  }

  const statusBadgeClass = (status: string) => {
    if (status === 'completed') return 'badge badge-completed'
    if (status === 'in progress') return 'badge badge-medium'
    return 'badge badge-pending'
  }

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Study Planner</h1>

      <form onSubmit={handleAdd} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Task</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Revise Binary Trees"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
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
            <label>Target date (optional)</label>
            <input
              type="date"
              className="input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn" style={{ width: 'auto' }}>
          Add Task
        </button>
      </form>

      <h2>Your Study Tasks</h2>
      {tasks.length === 0 ? (
        <p className="empty-state">No study tasks yet.</p>
      ) : (
        <div>
          {tasks.map((t) => (
            <div key={t.id} className="card">
              <div>
                <div className="card-title" style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                  {t.task_name}
                </div>
                <div className="card-meta">
                  {getSubjectName(t.subject_id) && <span>{getSubjectName(t.subject_id)} - </span>}
                  {t.target_date && <span>Target: {t.target_date} - </span>}
                  <span className={statusBadgeClass(t.status)}>{t.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => cycleStatus(t.id, t.status)} className="btn-secondary" style={{ color: 'var(--color-primary)' }}>
                  Next Status
                </button>
                <button onClick={() => handleDelete(t.id)} className="btn-secondary">
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
