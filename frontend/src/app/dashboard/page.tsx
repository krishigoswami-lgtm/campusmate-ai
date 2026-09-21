'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
      } else {
        setEmail(data.user.email ?? null)
      }
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="container-wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Welcome back, {email}</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Link href="/subjects" className="card" style={{ flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }}>
          <div className="card-title">Subjects</div>
          <div className="card-meta">Manage your subjects</div>
        </Link>
        <Link href="/assignments" className="card" style={{ flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }}>
          <div className="card-title">Assignments</div>
          <div className="card-meta">Track your assignments</div>
        </Link>
      </div>
    </div>
  )
}
