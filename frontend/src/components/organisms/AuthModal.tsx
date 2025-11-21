"use client"

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { X } from 'lucide-react'
import Button from '../atoms/Button'
import TextInput from '../atoms/TextInput'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient'

export type AuthMode = 'signin' | 'signup' | 'reset'

const AUTH_COPY: Record<AuthMode, { title: string; description: string; cta: string }> = {
  signin: {
    title: 'Entrar na Susana IA',
    description: 'Use seu e-mail cadastrado no Supabase para acessar o chat, dashboards e fluxos seguros.',
    cta: 'Entrar agora',
  },
  signup: {
    title: 'Criar conta gratuita',
    description: 'Disponível no plano free do Supabase. Após confirmar o e-mail, o acesso é liberado.',
    cta: 'Criar conta',
  },
  reset: {
    title: 'Recuperar senha',
    description: 'Informe o e-mail cadastrado para receber um link seguro de redefinição.',
    cta: 'Enviar link',
  },
}

type FeedbackState = { type: 'success' | 'error'; text: string } | null

type Props = {
  open: boolean
  mode: AuthMode
  onClose: () => void
  onModeChange: (nextMode: AuthMode) => void
}

export default function AuthModal({ open, mode, onClose, onModeChange }: Props) {
  const supabase = getSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  useEffect(() => {
    if (!open) {
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setFeedback(null)
    } else {
      setFeedback(null)
    }
  }, [open, mode])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase) {
      setFeedback({
        type: 'error',
        text: 'Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para usar o login.',
      })
      return
    }

    if (!email) {
      setFeedback({ type: 'error', text: 'Informe um e-mail válido.' })
      return
    }

    if (mode !== 'reset' && password.length < 6) {
      setFeedback({ type: 'error', text: 'A senha precisa ter pelo menos 6 caracteres.' })
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setFeedback({ type: 'error', text: 'As senhas não conferem.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          throw error
        }
        setFeedback({ type: 'success', text: 'Login realizado com sucesso! Redirecionando...' })
        setTimeout(() => {
          window.location.href = '/chat'
        }, 600)
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
          throw error
        }
        setFeedback({
          type: 'success',
          text: 'Conta criada! Verifique seu e-mail para confirmar e liberar o acesso.',
        })
      }

      if (mode === 'reset') {
        const { origin } = window.location
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/chat`,
        })
        if (error) {
          throw error
        }
        setFeedback({
          type: 'success',
          text: 'Enviamos um link para redefinir sua senha. Confira a sua caixa de entrada.',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível concluir sua solicitação.'
      setFeedback({ type: 'error', text: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        elevation: 12,
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid rgba(15,23,42,0.08)',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
        },
      }}
    >
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
        <IconButton onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </Box>

      <Box sx={{ p: { xs: 3.5, md: 5 } }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Chip label="Autenticação Supabase" size="small" color="primary" sx={{ alignSelf: 'flex-start' }} />
            <Typography variant="h5" fontWeight={700}>
              {AUTH_COPY[mode].title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {AUTH_COPY[mode].description}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            {(['signin', 'signup', 'reset'] as AuthMode[]).map((value) => (
              <Button
                key={value}
                variant={mode === value ? 'contained' : 'outlined'}
                color={mode === value ? 'primary' : 'inherit'}
                size="small"
                onClick={() => onModeChange(value)}
                sx={{ flex: 1, borderRadius: 999 }}
              >
                {value === 'signin' && 'Entrar'}
                {value === 'signup' && 'Criar conta'}
                {value === 'reset' && 'Recuperar'}
              </Button>
            ))}
          </Stack>

          {feedback && <Alert severity={feedback.type}>{feedback.text}</Alert>}

          {!supabase && (
            <Alert severity="warning">
              Defina as variáveis do Supabase no arquivo `.env.local` para ativar os formulários.
            </Alert>
          )}

          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextInput
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting || !supabase}
            />

            {mode !== 'reset' && (
              <TextInput
                label="Senha"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting || !supabase}
              />
            )}

            {mode === 'signup' && (
              <TextInput
                label="Confirmar senha"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={submitting || !supabase}
              />
            )}

            <Button type="submit" isLoading={submitting} disabled={submitting || !supabase} size="large">
              {AUTH_COPY[mode].cta}
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Este fluxo usa o Authentication do plano free do Supabase. Configure as políticas no dashboard para liberar o
            acesso público e, se desejar, personalize os e-mails transacionais.
          </Typography>
        </Stack>
      </Box>
    </Dialog>
  )
}
