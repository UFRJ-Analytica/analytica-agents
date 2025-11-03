"use client"
import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '../../src/components/atoms/Button'
import ChatPanel from '../../src/components/organisms/ChatPanel'

export default function ChatPage() {
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const handleGenerateToken = async () => {
    setTokenLoading(true)
    setTokenError(null)
    try {
      const res = await fetch('/api/token', { method: 'POST' })
      if (!res.ok) {
        throw new Error(`Erro ${res.status}`)
      }
      const data = await res.json()
      setToken(data.access_token)
    } catch (err) {
      console.error(err)
      setToken(null)
      setTokenError('Não foi possível gerar um token agora. Tente novamente em instantes.')
    } finally {
      setTokenLoading(false)
    }
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1.5}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Susana IA
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={640}>
          Converse com a assistente inteligente da Analytica Agents, explore insights sobre o SUS e acompanhe os
          resultados das ferramentas utilizadas durante a conversa.
        </Typography>
        {token && (
          <Chip
            color="success"
            label="Token pronto"
            sx={{ alignSelf: { xs: 'flex-start', sm: 'flex-start' } }}
          />
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Button onClick={handleGenerateToken} isLoading={tokenLoading} sx={{ minWidth: 180 }}>
          Obter Token
        </Button>
        {!token && !tokenError && (
          <Typography variant="body2" color="text.secondary">
            Gere um token antes de perguntar para ativar todas as capacidades da Susana IA.
          </Typography>
        )}
      </Stack>

      {tokenError && <Alert severity="error">{tokenError}</Alert>}

      <ChatPanel token={token} />
    </Stack>
  )
}
