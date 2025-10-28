"use client"
import { useState } from 'react'
import ChatPanel from '../../src/components/organisms/ChatPanel'

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null)

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Susana IA</h1>
      <p style={{ color: '#555' }}>Converse com a assistente. Gere um token e faça sua pergunta.</p>
      <div style={{ margin: '12px 0' }}>
        <button onClick={async () => {
          const res = await fetch('/api/token', { method: 'POST' })
          const data = await res.json()
          setToken(data.access_token)
        }}>
          Obter Token
        </button>
        {token && <span style={{ marginLeft: 12, color: '#0a0' }}>Token pronto</span>}
      </div>
      <ChatPanel token={token} />
    </main>
  )
}
