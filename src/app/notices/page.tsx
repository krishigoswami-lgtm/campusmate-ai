'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Notice = {
  id: string
  title: string
  content: string | null
  category: string
  published_at: string
  user_id: string
}

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const router = useRouter()

  const loadData = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setNotices(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
        return
      }
      setUserId(data.user.id)
      loadData()
    }
    init()
  }, [router])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.from('notices').insert({
      title,
      content: content || null,
      category,
      user_id: userId,
    })

    if (error) {
      setError(error.message)
    } else {
      setTitle('')
      setContent('')
      setCategory('general')
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('notices').delete().eq('id', id)
    loadData()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Notices</h1>

      <form onSubmit={handleAdd} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Mid-Semester Exam Schedule Released"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="exam">Exam</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div className="field">
          <label>Content</label>
          <textarea
            className="input"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn" style={{ width: 'auto' }}>
          Post Notice
        </button>
      </form>

      <h2>All Notices</h2>
      {notices.length === 0 ? (
        <p className="empty-state">No notices yet.</p>
      ) : (
        <div>
          {notices.map((n) => (
            <div key={n.id} className="card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="card-title">{n.title}</div>
                  <div className="card-meta">
                    <span className="badge badge-pending">{n.category}</span>
                    {' '}
                    {formatDate(n.published_at)}
                  </div>
                </div>
                {n.user_id === userId && (
                  <button onClick={() => handleDelete(n.id)} className="btn-secondary">
                    Delete
                  </button>
                )}
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
