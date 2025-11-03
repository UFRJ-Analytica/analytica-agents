"use client"
import React, { useMemo, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '../atoms/Button'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  meta?: {
    ano?: number
  }
  toolName?: string | null
  toolResult?: unknown
}

type Props = {
  message: ChatMessage
}

export default function MessageItem({ message }: Props) {
  const [showToolResult, setShowToolResult] = useState(false)

  const isUser = message.role === 'user'

  const formattedTime = useMemo(() => {
    const date = new Date(message.createdAt)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }, [message.createdAt])

  const handleToggleTool = () => setShowToolResult((prev) => !prev)

  const toolResultPretty = useMemo(() => {
    if (message.toolResult === null || message.toolResult === undefined) {
      return null
    }
    try {
      return JSON.stringify(message.toolResult, null, 2)
    } catch (error) {
      console.error('Erro ao formatar resultado da ferramenta', error)
      return 'Não foi possível exibir o resultado da ferramenta.'
    }
  }, [message.toolResult])

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
      alignItems="flex-start"
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: 'primary.main', boxShadow: 1 }}>
          AI
        </Avatar>
      )}

      <Box
        sx={{
          maxWidth: { xs: '85%', md: '75%' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          gap: 0.5,
        }}
      >
        <Paper
          elevation={isUser ? 0 : 1}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 3,
            borderTopRightRadius: isUser ? 0 : 12,
            borderTopLeftRadius: isUser ? 12 : 0,
            border: '1px solid',
            borderColor: isUser ? 'transparent' : 'divider',
            width: '100%',
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          {isUser && message.meta?.ano && (
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, mt: 1 }}>
              Ano consultado: {message.meta.ano}
            </Typography>
          )}
        </Paper>

        {formattedTime && (
          <Typography variant="caption" color="text.secondary">
            {isUser ? 'Você' : 'Susana IA'} • {formattedTime}
          </Typography>
        )}

        {message.toolName && toolResultPretty && (
          <Box sx={{ width: '100%' }}>
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={handleToggleTool}
              sx={{ px: 0, justifyContent: 'flex-start' }}
            >
              {showToolResult ? 'Ocultar' : 'Ver'} resultado da ferramenta {message.toolName}
            </Button>
            <Collapse in={showToolResult}>
              <Paper
                variant="outlined"
                sx={{
                  mt: 1,
                  p: 1.5,
                  bgcolor: 'grey.50',
                  maxHeight: 240,
                  overflow: 'auto',
                }}
              >
                <Typography
                  component="pre"
                  variant="caption"
                  sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'Roboto Mono, monospace' }}
                >
                  {toolResultPretty}
                </Typography>
              </Paper>
            </Collapse>
          </Box>
        )}
      </Box>

      {isUser && (
        <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', boxShadow: 1 }}>
          VC
        </Avatar>
      )}
    </Stack>
  )
}
