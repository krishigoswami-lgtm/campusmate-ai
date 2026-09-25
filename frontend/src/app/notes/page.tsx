'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
}

type Note = {
  id: string
  title: string
  content: string | null
  subject_id: string | null
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const router = useRouter()

  const loadData = async () => {
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name')

    if (noteError) {
      setError(noteError.message)
    } else {
      setNotes(noteData ?? [])
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

    const { error } = await supabase.from('notes').insert({
      title,
      content: content || null,
      subject_id: subjectId || null,
      user_id: userData.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setTitle('')
      setContent('')
      setSubjectId('')
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    loadData()
  }

  const getSubjectName = (id: string | null) => {
    if (!id) return null
    return subjects.find((s) => s.id === id)?.name
  }

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.content ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Notes</h1>

      <form onSubmit={handleAdd} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Binary Trees - Key Points"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
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
          <label>Content</label>
          <textarea
            className="input"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn" style={{ width: 'auto' }}>
          Add Note
        </button>
      </form>

      <div className="field">
        <input
          type="text"
          className="input"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <h2>Your Notes</h2>
      {filteredNotes.length === 0 ? (
        <p className="empty-state">No notes found.</p>
      ) : (
        <div>
          {filteredNotes.map((n) => (
            <div key={n.id} className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="card-title">{n.title}</div>
                  {getSubjectName(n.subject_id) && (
                    <div className="card-meta">{getSubjectName(n.subject_id)}</div>
                  )}
                </div>
                <button onClick={() => handleDelete(n.id)} className="btn-secondary">
                  Delete
                </button>
              </div>
              {n.content && (
                <p style={{ marginTop: '0.75rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                  {n.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
