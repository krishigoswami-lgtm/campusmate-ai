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

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Subjects</h1>

      <form onSubmit={handleAdd} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="Subject name (e.g. Data Structures)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="Subject code (optional)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <input
            type="number"
            placeholder="Semester (optional)"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Add Subject
        </button>
      </form>

      <h2>Your Subjects</h2>
      {subjects.length === 0 ? (
        <p>No subjects added yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {subjects.map((subject) => (
            <li
              key={subject.id}
              style={{
                border: '1px solid #ccc',
                padding: '1rem',
                marginBottom: '0.5rem',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong>{subject.name}</strong>
                {subject.code && <span> ({subject.code})</span>}
                {subject.semester && <span> - Semester {subject.semester}</span>}
              </div>
              <button onClick={() => handleDelete(subject.id)} style={{ padding: '0.25rem 0.5rem' }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
