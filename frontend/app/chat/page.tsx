"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '../../src/components/atoms/Button'
import ChatPanel from '../../src/components/organisms/ChatPanel'
import { useAuth } from '../../src/components/providers/AuthProvider'

export default function ChatPage() {
  const { session, loading, token, tokenLoading, tokenError, refreshToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/?auth=signin')
    }
  }, [loading, session, router])

  if (loading) {
    return (
      <Stack spacing={2} minHeight="70vh" alignItems="center" justifyContent="center">
        <Typography variant="body1" color="text.secondary">
          Verificando credenciais...
        </Typography>
      </Stack>
    )
  }

  if (!session) {
    return (
      <Stack spacing={2} minHeight="70vh" alignItems="center" justifyContent="center">
        <Typography variant="body1" color="text.secondary">
          Redirecionando para a tela de acesso.
        </Typography>
        <Button onClick={() => router.replace('/?auth=signin')}>
          Ir para a landing
        </Button>
      </Stack>
    )
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
          <Chip color="success" label="Token pronto" sx={{ alignSelf: { xs: 'flex-start', sm: 'flex-start' } }} />
        )}
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Button onClick={refreshToken} isLoading={tokenLoading} sx={{ minWidth: 180 }}>
          Gerar novo token
        </Button>
        {!token && !tokenError && (
          <Typography variant="body2" color="text.secondary">
            O token e criado automaticamente apos o login. Caso precise, gere novamente.
          </Typography>
        )}
      </Stack>

      {tokenError && <Alert severity="error">{tokenError}</Alert>}

      <ChatPanel token={token} />
    </Stack>
  )
}
