'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Subject = {
  id: string
  name: string
}

type Resource = {
  id: string
  title: string
  file_path: string
  file_type: string | null
  subject_id: string | null
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const router = useRouter()

  const loadData = async (uid: string) => {
    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id, name')

    if (resourceError) {
      setError(resourceError.message)
    } else {
      setResources(resourceData ?? [])
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
      setUserId(data.user.id)
      loadData(data.user.id)
    }
    init()
  }, [router])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!file) {
      setError('Please choose a file')
      return
    }

    setUploading(true)

    const filePath = `${userId}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from('resources').insert({
      title,
      file_path: filePath,
      file_type: file.type,
      subject_id: subjectId || null,
      user_id: userId,
    })

    setUploading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      setTitle('')
      setSubjectId('')
      setFile(null)
      loadData(userId)
    }
  }

  const handleDownload = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('resources')
      .createSignedUrl(filePath, 60)

    if (error) {
      setError(error.message)
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  const handleDelete = async (id: string, filePath: string) => {
    await supabase.storage.from('resources').remove([filePath])
    await supabase.from('resources').delete().eq('id', id)
    loadData(userId)
  }

  const getSubjectName = (id: string | null) => {
    if (!id) return null
    return subjects.find((s) => s.id === id)?.name
  }

  if (loading) return <div className="container-wide">Loading...</div>

  return (
    <div className="container-wide">
      <h1>Resources</h1>

      <form onSubmit={handleUpload} className="card" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '2rem' }}>
        <div className="field">
          <label>Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Unit 1 Notes"
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
          <label>File</label>
          <input
            type="file"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn" style={{ width: 'auto' }} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Resource'}
        </button>
      </form>

      <h2>Your Resources</h2>
      {resources.length === 0 ? (
        <p className="empty-state">No resources uploaded yet.</p>
      ) : (
        <div>
          {resources.map((r) => (
            <div key={r.id} className="card">
              <div>
                <div className="card-title">{r.title}</div>
                <div className="card-meta">
                  {getSubjectName(r.subject_id) && <span>{getSubjectName(r.subject_id)} - </span>}
                  <span>{r.file_type}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleDownload(r.file_path)} className="btn-secondary" style={{ color: 'var(--color-primary)' }}>
                  Download
                </button>
                <button onClick={() => handleDelete(r.id, r.file_path)} className="btn-secondary">
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
