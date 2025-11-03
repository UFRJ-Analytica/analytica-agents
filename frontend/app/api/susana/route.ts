import { NextRequest } from 'next/server'

function runtimeConfig() {
  const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  const BACKEND_USERNAME = process.env.BACKEND_USERNAME || 'admin'
  const BACKEND_PASSWORD = process.env.BACKEND_PASSWORD || 'admin123'
  return { BACKEND_URL, BACKEND_USERNAME, BACKEND_PASSWORD }
}

async function getToken(): Promise<string | null> {
  const { BACKEND_URL, BACKEND_USERNAME, BACKEND_PASSWORD } = runtimeConfig()
  try {
    const r = await fetch(`${BACKEND_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BACKEND_USERNAME, password: BACKEND_PASSWORD })
    })
    if (!r.ok) return null
    const j = await r.json()
    return j?.access_token || null
  } catch (err) {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { BACKEND_URL } = runtimeConfig()
  const body = await req.json().catch(() => ({} as any))
  const authHeader = req.headers.get('authorization')
  let token: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  if (!token) token = await getToken()

  try {
    const r = await fetch(`${BACKEND_URL}/susana`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    const text = await r.text()
    return new Response(text, { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'fetch_failed', detail: String(err), backend: BACKEND_URL }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

