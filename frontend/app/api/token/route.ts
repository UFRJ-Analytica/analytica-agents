import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
const BACKEND_USERNAME = process.env.BACKEND_USERNAME || 'admin'
const BACKEND_PASSWORD = process.env.BACKEND_PASSWORD || 'admin123'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const username = body.username || BACKEND_USERNAME
  const password = body.password || BACKEND_PASSWORD

  const r = await fetch(`${BACKEND_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })

  const text = await r.text()
  return new Response(text, { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/json' } })
}

