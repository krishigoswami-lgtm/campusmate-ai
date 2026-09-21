'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
  code: string | null
  semester: number | null
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [semester, setSemester] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setSubjects(data ?? [])
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
      loadSubjects()
    }
    init()
  }, [router])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { error } = await supabase.from('subjects').insert({
      name,
      code: code || null,
      semester: semester ? parseInt(semester) : null,
      user_id: userData.user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setName('')
      setCode('')
      setSemester('')
      loadSubjects()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id)
    loadSubjects()
  }

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Subjects</h1>

      <form onSubmit={handleAdd} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Subject name</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Data Structures"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Subject code (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. CS201"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Semester (optional)</label>
          <input
            type="number"
            className="input"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn" style={{ width: 'auto' }}>
          Add Subject
        </button>
      </form>

      <h2>Your Subjects</h2>
      {subjects.length === 0 ? (
        <p className="empty-state">No subjects added yet.</p>
      ) : (
        <div>
          {subjects.map((subject) => (
            <div key={subject.id} className="card">
              <div>
                <div className="card-title">{subject.name}</div>
                <div className="card-meta">
                  {subject.code && <span>{subject.code}</span>}
                  {subject.code && subject.semester && <span> - </span>}
                  {subject.semester && <span>Semester {subject.semester}</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(subject.id)} className="btn-secondary">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
