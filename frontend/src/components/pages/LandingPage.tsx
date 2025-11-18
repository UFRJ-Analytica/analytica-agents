"use client"

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '../atoms/Button'
import TextInput from '../atoms/TextInput'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient'
import { useAuth } from '../providers/AuthProvider'
import SusanaLogo from '../../../assets/images/Susana IA Logo.png'

const FEATURES = [
  {
    title: 'Insights sobre o SUS',
    description: 'Painel inteligente com indicadores, histórico de atendimentos e recomendações táticas.',
  },
  {
    title: 'Assistente multicanal',
    description: 'Converse com a Susana IA por texto e receba respostas contextualizadas em tempo real.',
  },
  {
    title: 'Relatórios acionáveis',
    description: 'Baixe evidências e compartilhe com sua equipe para acelerar decisões na gestão pública.',
  },
]

const AUTH_COPY = {
  signin: {
    title: 'Entrar na Susana IA',
    description: 'Use seu e-mail cadastrado no Supabase para acessar o chat e o painel analítico.',
    cta: 'Entrar agora',
  },
  signup: {
    title: 'Criar conta gratuita',
    description: 'Disponível no plano free do Supabase. Confirme seu e-mail para liberar o acesso.',
    cta: 'Criar conta',
  },
  reset: {
    title: 'Recuperar senha',
    description: 'Envie o e-mail cadastrado para receber um link seguro de redefinição.',
    cta: 'Enviar link',
  },
}

type AuthMode = keyof typeof AUTH_COPY

export default function LandingPage() {
  const { session } = useAuth()

  return (
    <Stack spacing={{ xs: 6, md: 8 }}>
      <HeroSection isAuthenticated={Boolean(session)} />
      <FeatureHighlights />
    </Stack>
  )
}

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
        gap: { xs: 4, md: 6 },
        alignItems: 'stretch',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          p: { xs: 4, md: 5 },
          background: 'linear-gradient(135deg, rgba(0,81,255,0.06) 0%, rgba(124,58,237,0.08) 100%)',
          border: '1px solid rgba(0,81,255,0.08)',
        }}
      >
        <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 20px 45px rgba(15,23,42,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                }}
              >
                <Image
                  src={SusanaLogo}
                  alt="Logotipo Susana IA"
                  priority
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
              <Stack spacing={0.5}>
                <Typography variant="h5" color="primary" fontWeight={700}>
                  Susana IA
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inteligência Analytica Agents para o SUS
                </Typography>
              </Stack>
            </Stack>

            <Stack spacing={2}>
              <Typography variant="h3" fontWeight={700} lineHeight={1.2}>
                Centralize dados, perguntas e decisões sobre o SUS em um único lugar.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Combine mapas, séries históricas e a assistente conversacional para monitorar programas, detectar riscos e
                responder rapidamente às demandas das equipes de saúde.
              </Typography>
            </Stack>

            {isAuthenticated ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button component={Link} href="/chat" variant="contained" color="primary" size="large" sx={{ minWidth: 180 }}>
                  Ir para o chat
                </Button>
                <Button component={Link} href="/map" variant="outlined" color="secondary" size="large">
                  Ver mapa interativo
                </Button>
              </Stack>
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button component="a" href="#auth-card" variant="contained" color="primary" size="large" sx={{ minWidth: 200 }}>
                  Entrar para acessar
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  Autentique-se abaixo para liberar o chat e o mapa protegidos.
                </Typography>
              </Stack>
            )}

            <Divider flexItem />

            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Recursos em destaque
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                {['Relatórios instantâneos', 'Alertas operacionais', 'Exportação em CSV', 'Plano free do Supabase'].map(
                  (highlight) => (
                    <Chip
                      key={highlight}
                      label={highlight}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 999 }}
                    />
                  ),
                )}
              </Stack>
            </Stack>
        </Stack>
      </Paper>
      <AuthCard />
    </Box>
  )
}

function FeatureHighlights() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: { xs: 3, md: 4 },
      }}
    >
      {FEATURES.map((feature) => (
        <Paper
          key={feature.title}
          elevation={0}
          sx={{
            height: '100%',
            p: 3,
            border: '1px solid rgba(15,23,42,0.08)',
            backgroundColor: '#fff',
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="h6" fontWeight={700}>
              {feature.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {feature.description}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}

function AuthCard() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSwitchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setFeedback(null)
    setPassword('')
    setConfirmPassword('')
  }

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
        }, 800)
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
    <Paper
      id="auth-card"
      elevation={0}
      sx={{
        height: '100%',
        p: { xs: 4, md: 5 },
        border: '1px solid rgba(15,23,42,0.08)',
        bgcolor: 'rgba(255,255,255,0.95)',
      }}
    >
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
              onClick={() => handleSwitchMode(value)}
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

          <Button
            type="submit"
            isLoading={submitting}
            disabled={submitting || !supabase}
            size="large"
          >
            {AUTH_COPY[mode].cta}
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Este fluxo usa o Authentication do plano free do Supabase. Configure as políticas no dashboard para liberar o
          acesso público e, se desejar, personalize os e-mails transacionais.
        </Typography>
      </Stack>
    </Paper>
  )
}
