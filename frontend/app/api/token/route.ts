import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  // Leia as variáveis em tempo de execução (evita inlining no build)
  const RUNTIME_BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  const DEFAULT_USERNAME = process.env.BACKEND_USERNAME || 'admin'
  const DEFAULT_PASSWORD = process.env.BACKEND_PASSWORD || 'admin123'

  const body = await req.json().catch(() => ({} as any))
  const username = body.username || DEFAULT_USERNAME
  const password = body.password || DEFAULT_PASSWORD

  try {
    const r = await fetch(`${RUNTIME_BACKEND_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const text = await r.text()
    return new Response(text, {
      status: r.status,
      headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/json' }
    })
  } catch (err: any) {
    // Retorna erro explícito para facilitar diagnóstico
    return new Response(JSON.stringify({ error: 'fetch_failed', detail: String(err), backend: RUNTIME_BACKEND_URL }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

