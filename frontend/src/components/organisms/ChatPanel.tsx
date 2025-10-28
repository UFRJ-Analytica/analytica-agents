"use client"
import React, { useState } from 'react'
import ChatControls from '../molecules/ChatControls'

type Props = { token: string | null }

export default function ChatPanel({ token }: Props) {
  const [query, setQuery] = useState('Quais unidades mais estressadas em 2024 e o mapa delas?')
  const [ano, setAno] = useState<number>(2024)
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<any | null>(null)

  const onAsk = async () => {
    setLoading(true)
    setResp(null)
    try {
      const res = await fetch('/api/susana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, ano }),
      })
      const data = await res.json()
      setResp(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <ChatControls
        query={query}
        onQueryChange={setQuery}
        ano={ano}
        onAnoChange={setAno}
        loading={loading}
        onAsk={onAsk}
      />

      {resp && (
        <div style={{ marginTop: 16 }}>
          <h3>Resposta</h3>
          <p>{resp.answer}</p>
          {resp.used_tool && (
            <details style={{ marginTop: 8 }}>
              <summary>Resultado da Tool</summary>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(resp.tool_result, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

