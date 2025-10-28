"use client"
import React from 'react'
import TextInput from '../atoms/TextInput'
import Button from '../atoms/Button'

type Props = {
  query: string
  onQueryChange: (v: string) => void
  ano: number
  onAnoChange: (v: number) => void
  loading: boolean
  onAsk: () => void
}

export default function ChatControls({ query, onQueryChange, ano, onAnoChange, loading, onAsk }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
      <TextInput value={query} onChange={(e) => onQueryChange(e.target.value)} style={{ flex: 1 }} />
      <TextInput type="number" value={ano} onChange={(e) => onAnoChange(Number(e.target.value))} style={{ width: 120 }} />
      <Button onClick={onAsk} disabled={loading || !query} variant="primary">
        {loading ? 'Perguntando...' : 'Perguntar'}
      </Button>
    </div>
  )
}

