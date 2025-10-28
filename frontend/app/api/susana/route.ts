import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
const BACKEND_USERNAME = process.env.BACKEND_USERNAME || 'admin'
const BACKEND_PASSWORD = process.env.BACKEND_PASSWORD || 'admin123'

async function getToken(): Promise<string | null> {
  try {
    const r = await fetch(`${BACKEND_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: BACKEND_USERNAME, password: BACKEND_PASSWORD })
    })
    if (!r.ok) return null
    const j = await r.json()
    return j?.access_token || null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const authHeader = req.headers.get('authorization')
  let token: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  if (!token) token = await getToken()

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
}

