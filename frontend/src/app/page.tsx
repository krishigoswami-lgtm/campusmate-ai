import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { error } = await supabase.from('_test_connection').select('*').limit(1)

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>CampusMate AI</h1>
      {error ? (
        <p style={{ color: 'green' }}>
          ✅ Connected to Supabase (expected error: table doesn&apos;t exist yet — that&apos;s fine, it proves the connection works)
        </p>
      ) : (
        <p>Unexpected result — check with Claude</p>
      )}
    </div>
  )
}