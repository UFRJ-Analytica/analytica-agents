"use client"
import React from 'react'
import Stack from '@mui/material/Stack'
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
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onAsk()
  }

  return (
    <Stack
      component="form"
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      onSubmit={handleSubmit}
      sx={{ width: '100%', alignItems: { xs: 'stretch', md: 'flex-end' } }}
    >
      <TextInput
        label="Pergunta"
        placeholder="Faça sua pergunta para a Susana IA"
        multiline
        minRows={2}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        sx={{ flex: 1 }}
      />
      <TextInput
        label="Ano"
        type="number"
        value={ano}
        onChange={(event) => onAnoChange(Number(event.target.value))}
        inputProps={{ min: 2000, max: new Date().getFullYear() }}
        sx={{ width: { xs: '100%', md: 140 } }}
      />
      <Button
        type="submit"
        isLoading={loading}
        disabled={loading || !query.trim()}
        sx={{ minWidth: { xs: '100%', md: 160 }, py: 1.2 }}
      >
        Perguntar
      </Button>
    </Stack>
  )
}

