"use client"
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import type { ChipProps } from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ChatControls from '../molecules/ChatControls'
import MessageItem, { ChatMessage } from '../molecules/MessageItem'

type Props = { token: string | null }

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

export default function ChatPanel({ token }: Props) {
  const [query, setQuery] = useState('Quais unidades mais estressadas em 2024 e o mapa delas?')
  const [ano, setAno] = useState<number>(2024)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const tokenStatus = useMemo<{ label: string; color: ChipProps['color']; variant: ChipProps['variant'] }>(() => {
    return token
      ? { label: 'Token ativo', color: 'success', variant: 'filled' }
      : { label: 'Token não gerado', color: 'default', variant: 'outlined' }
  }, [token])

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }

  const onAsk = async () => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      return
    }

    setError(null)

    appendMessage({
      id: createId(),
      role: 'user',
      content: trimmedQuery,
      createdAt: new Date().toISOString(),
      meta: { ano },
    })
    setQuery('')

    setLoading(true)

    try {
      const res = await fetch('/api/susana', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: trimmedQuery, ano }),
      })

      if (!res.ok) {
        throw new Error(`Erro ${res.status}`)
      }

      const data = await res.json()

      appendMessage({
        id: createId(),
        role: 'assistant',
        content: data?.answer ?? 'Não foi possível gerar uma resposta.',
        createdAt: new Date().toISOString(),
        toolName: data?.used_tool ?? null,
        toolResult: data?.used_tool ? data?.tool_result : null,
      })
    } catch (err) {
      console.error(err)
      setError('Não foi possível obter a resposta agora. Tente novamente em instantes.')
      appendMessage({
        id: createId(),
        role: 'assistant',
        content: 'Desculpe, algo deu errado por aqui. Vamos tentar novamente?',
        createdAt: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>
      <CardHeader
        title="Fluxo de conversa"
        subheader="Faça perguntas sobre as unidades e visualize o resultado das ferramentas em tempo real."
        action={<Chip label={tokenStatus.label} color={tokenStatus.color} variant={tokenStatus.variant} />}
        sx={{ pb: 1.5 }}
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {!token && (
          <Alert severity="info">
            Gere um token antes de perguntar para ter acesso completo às respostas da Susana IA.
          </Alert>
        )}

        <ChatControls
          query={query}
          onQueryChange={setQuery}
          ano={ano}
          onAnoChange={setAno}
          loading={loading}
          onAsk={onAsk}
        />

        <Divider flexItem />

        {error && <Alert severity="error">{error}</Alert>}

        <Box
          ref={listRef}
          sx={{
            flex: 1,
            minHeight: { xs: 260, md: 320 },
            maxHeight: { xs: 320, md: 440 },
            overflowY: 'auto',
            pr: 1,
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1,
                color: 'text.secondary',
                height: '100%',
                textAlign: 'center',
                px: 3,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Comece a conversa
              </Typography>
              <Typography variant="body2">
                Use a caixa acima para enviar sua primeira pergunta e acompanhe as respostas do assistente por aqui.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5} sx={{ py: 1 }}>
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

