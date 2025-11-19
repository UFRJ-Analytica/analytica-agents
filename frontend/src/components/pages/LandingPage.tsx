"use client"

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Lenis from 'lenis'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
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

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Conecte dados críticos',
    description:
      'Integre prontuários, produção assistencial, filas, capacidade instalada e indicadores que já existem na sua rede.',
  },
  {
    title: 'IA generativa dedicada à saúde',
    description:
      'A Susana IA combina modelagem de dados, algoritmos proprietários e LLMs para entender padrões e prever riscos.',
  },
  {
    title: 'Insights, resumos e alertas',
    description:
      'Dashboards vivos, resumos por unidade e alertas contextuais chegam para gestores e equipes no momento certo.',
  },
  {
    title: 'Ação conectada',
    description:
      'Times assistenciais, administrativos e regulatórios agem com segurança, eficiência e histórico documentado.',
  },
]

const BENEFIT_PROFILES = [
  {
    title: 'Gestores de clínicas e hospitais',
    highlights: [
      'Visão consolidada de unidades, leitos e equipes.',
      'Indicadores críticos em tempo real com foco em gargalos.',
      'Painéis de produção para antecipar riscos assistenciais.',
    ],
  },
  {
    title: 'Profissionais de saúde',
    highlights: [
      'Resumos inteligentes de casos e pacientes prioritários.',
      'Contexto ao lado dos dados clínicos para acelerar decisões.',
      'Alertas sobre filas, riscos e necessidade de intervenção.',
    ],
  },
  {
    title: 'Equipes administrativas, BI e regulação',
    highlights: [
      'Automação de análises repetitivas e relatórios operacionais.',
      'Integrações com as principais fontes de dados da rede.',
      'Tempo real para responder demandas estratégicas e de auditoria.',
    ],
  },
]

const PREVIEW_PANELS = [
  {
    title: 'Indicadores assistenciais',
    metric: '95%',
    description: 'Taxa de ocupação segura nas últimas 12h, com alerta para equilíbrio entre UTIs.',
    accent: 'linear-gradient(135deg, #1FA2FF, #12D8FA, #A6FFCB)',
  },
  {
    title: 'Insights gerados',
    metric: '+32',
    description: 'Novos insights de filas e capacidade instalados nesta semana.',
    accent: 'linear-gradient(135deg, #7F7FD5, #86A8E7, #91EAE4)',
  },
  {
    title: 'Alertas críticos',
    metric: '4',
    description: 'Fluxos assistenciais que exigem atenção imediata para evitar risco assistencial.',
    accent: 'linear-gradient(135deg, #43CBFF, #9708CC)',
  },
]

const SECURITY_POINTS = [
  'Arquitetura pensada para LGPD, com criptografia em repouso e em trânsito.',
  'Monitoramento contínuo, auditoria e rastreabilidade de acessos.',
  'Infraestrutura em nuvem com certificações e isolamento por inquilino.',
  'Processos de suporte com foco em privacidade e governança em saúde.',
]

const AUTH_COPY = {
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

type AuthMode = keyof typeof AUTH_COPY

export default function LandingPage() {
  const { session } = useAuth()
  useSmoothScroll()

  return (
    <Stack spacing={{ xs: 8, md: 12 }} sx={{ pb: { xs: 8, md: 16 } }}>
      <HeroSection isAuthenticated={Boolean(session)} />
      <HowItWorksSection />
      <BenefitsSection />
      <PreviewSection />
      <SecuritySection />
      <FinalCTA isAuthenticated={Boolean(session)} />
    </Stack>
  )
}

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { scrollY } = useScroll()
  const prefersReducedMotion = useReducedMotion()
  const slowLayer = useTransform(scrollY, (value) => (prefersReducedMotion ? 0 : value * -0.08))
  const fastLayer = useTransform(scrollY, (value) => (prefersReducedMotion ? 0 : value * -0.14))

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 4, md: 6 },
        px: { xs: 3, md: 5 },
        py: { xs: 5, md: 6 },
        border: '1px solid rgba(15,23,42,0.12)',
        background:
          'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.08), transparent 45%), radial-gradient(circle at 80% 10%, rgba(37,99,235,0.12), transparent 50%)',
      }}
    >
      <Box
        component={motion.span}
        style={{ y: slowLayer }}
        sx={{
          position: 'absolute',
          width: 260,
          height: 260,
          top: -90,
          left: -40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.35), rgba(99,102,241,0.4))',
          filter: 'blur(20px)',
          opacity: { xs: 0.4, md: 0.7 },
          pointerEvents: 'none',
        }}
      />
      <Box
        component={motion.span}
        style={{ y: fastLayer }}
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          bottom: -140,
          right: -80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(168,85,247,0.35))',
          filter: 'blur(30px)',
          opacity: { xs: 0.4, md: 0.7 },
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
          gap: { xs: 4, md: 6 },
          alignItems: 'stretch',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Stack spacing={3.5}>
          <Chip
            label="Saúde digital + IA generativa + gestão"
            color="primary"
            variant="outlined"
            sx={{ alignSelf: 'flex-start', borderRadius: 999, fontWeight: 600 }}
          />

          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: '0 20px 60px rgba(15,23,42,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1.5,
              }}
            >
              <Image src={SusanaLogo} alt="Logotipo Susana IA" priority style={{ width: '100%', height: '100%' }} />
            </Box>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Plataforma Susana IA
              </Typography>
              <Typography variant="h2" fontWeight={700} lineHeight={1.1}>
                IA generativa para transformar a gestão em saúde.
              </Typography>
            </Stack>
          </Stack>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
            Centralize dados, prontuários, filas e indicadores críticos. A Susana IA analisa em tempo quase real, gera
            insights acionáveis e conecta gestores, equipes assistenciais e operação para decisões seguras.
          </Typography>

          {isAuthenticated ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button component={Link} href="/chat" variant="contained" size="large">
                Abrir chat inteligente
              </Button>
              <Button component={Link} href="/map" variant="outlined" color="secondary" size="large">
                Navegar pelo mapa analítico
              </Button>
            </Stack>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button component="a" href="#auth-card" variant="contained" size="large" sx={{ minWidth: 200 }}>
                Criar conta ou acessar
              </Button>
              <Button component="a" href="#final-cta" variant="text" color="inherit">
                Falar com nossa equipe
              </Button>
            </Stack>
          )}

          <Divider sx={{ borderColor: 'rgba(15,23,42,0.1)' }} />

          <HeroDataFlows />
        </Stack>

        <AuthCard />
      </Box>
    </Paper>
  )
}

function HeroDataFlows() {
  const items = [
    { label: 'Unidades monitoradas', value: '64', detail: 'hospitais e clínicas' },
    { label: 'Alertas priorizados', value: '128', detail: 'fila, leito, produção' },
    { label: 'Pontes criadas com equipes', value: '1.2k', detail: 'insights compartilhados' },
  ]

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
      {items.map((item) => (
        <Paper
          key={item.label}
          elevation={0}
          sx={{
            flex: 1,
            p: 2.5,
            borderRadius: 3,
            border: '1px solid rgba(15,23,42,0.08)',
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(255,255,255,0.85)',
          }}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="overline" color="text.secondary">
            {item.label}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {item.value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.detail}
          </Typography>
        </Paper>
      ))}
    </Stack>
  )
}

function HowItWorksSection() {
  return (
    <Stack spacing={4}>
      <SectionHeading
        title="Como a Susana IA funciona"
        subtitle="Uma jornada fluida: conecte fontes, deixe a IA analisar e entregue respostas organizadas para cada time."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          gap: { xs: 2.5, md: 3 },
        }}
      >
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <Paper
            key={step.title}
            elevation={0}
            component={motion.div}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            sx={{
              height: '100%',
              p: 3,
              borderRadius: 3,
              border: '1px solid rgba(15,23,42,0.08)',
              background: 'linear-gradient(180deg, rgba(15,23,42,0.02), rgba(15,23,42,0.04))',
            }}
          >
            <Chip
              label={`0${index + 1}`}
              size="small"
              color="primary"
              sx={{ mb: 2, borderRadius: 999, fontWeight: 600, width: 'fit-content' }}
            />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {step.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step.description}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Stack>
  )
}

function BenefitsSection() {
  return (
    <Stack spacing={4}>
      <SectionHeading
        title="Benefícios para cada perfil"
        subtitle="Conte uma história distinta para gestores, equipes assistenciais e núcleos administrativos."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: { xs: 2.5, md: 3 },
        }}
      >
        {BENEFIT_PROFILES.map((profile, index) => (
          <Paper
            key={profile.title}
            elevation={0}
            component={motion.div}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            sx={{
              height: '100%',
              p: { xs: 3, md: 3.5 },
              borderRadius: 3,
              border: '1px solid rgba(15,23,42,0.08)',
              backgroundColor: 'rgba(255,255,255,0.98)',
              boxShadow: index === 1 ? '0 20px 60px rgba(55,65,81,0.15)' : 'none',
            }}
          >
            <Typography variant="overline" color="primary">
              Perfil
            </Typography>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {profile.title}
            </Typography>
            <Stack spacing={1.5}>
              {profile.highlights.map((highlight) => (
                <Stack key={highlight} direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mt: 0.8,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {highlight}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        ))}
      </Box>
    </Stack>
  )
}

function PreviewSection() {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: { xs: 4, md: 5 },
        p: { xs: 4, md: 6 },
        border: '1px solid rgba(15,23,42,0.08)',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.03), rgba(37,99,235,0.06))',
      }}
    >
      <Stack spacing={5}>
        <SectionHeading
          title="Demonstração visual"
          subtitle="Dashboards, mapas e cartazes clínicos ganham vida com camadas em parallax e dados animados."
        />

        <Box sx={{ position: 'relative', minHeight: { xs: 320, md: 420 } }}>
          {PREVIEW_PANELS.map((panel, index) => (
            <Paper
              key={panel.title}
              elevation={0}
              component={motion.div}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -6 }}
              sx={{
                position: 'absolute',
                top: index * 40,
                left: { xs: 0, md: index % 2 === 0 ? 0 : 120 },
                right: { xs: 0, md: index % 2 === 0 ? 120 : 0 },
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                backgroundColor: '#fff',
                border: '1px solid rgba(15,23,42,0.08)',
                boxShadow: '0 30px 80px rgba(15,23,42,0.2)',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    background: panel.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  {panel.metric}
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  {panel.title}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {panel.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Stack>
    </Paper>
  )
}

function SecuritySection() {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: { xs: 4, md: 5 },
        p: { xs: 4, md: 6 },
        border: '1px solid rgba(15,23,42,0.12)',
        backgroundColor: '#fff',
      }}
    >
      <Stack spacing={4}>
        <SectionHeading
          title="Segurança, privacidade e conformidade"
          subtitle="Hospitais, prefeituras e redes de saúde confiam porque segurança faz parte do DNA do produto."
        />
        <Stack spacing={2}>
          {SECURITY_POINTS.map((text) => (
            <Stack key={text} direction="row" spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: 'rgba(16,185,129,0.1)',
                  color: 'success.main',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✓
              </Box>
              <Typography variant="body1" color="text.secondary">
                {text}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

function FinalCTA({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Paper
      id="final-cta"
      elevation={0}
      sx={{
        borderRadius: { xs: 4, md: 5 },
        p: { xs: 4, md: 6 },
        border: '1px solid rgba(15,23,42,0.08)',
        background: 'linear-gradient(120deg, rgba(8,145,178,0.08), rgba(79,70,229,0.08))',
      }}
      component={motion.div}
      initial={{ opacity: 0.8 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={700}>
            Comece a jornada de IA generativa aplicada à saúde.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize fluxos decisórios, conecte dados e teste com sua equipe em minutos. Segurança, contexto clínico e
            gestão estão no centro.
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {isAuthenticated ? (
            <>
              <Button component={Link} href="/chat" variant="contained" size="large">
                Ir para o chat
              </Button>
              <Button component={Link} href="/map" variant="outlined" color="secondary" size="large">
                Ver mapa e indicadores
              </Button>
            </>
          ) : (
            <>
              <Button component="a" href="#auth-card" variant="contained" size="large">
                Criar conta agora
              </Button>
              <Button component={Link} href="mailto:oi@susana.health" variant="outlined" color="secondary" size="large">
                Falar com a equipe
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
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
        borderRadius: 4,
        border: '1px solid rgba(15,23,42,0.12)',
        bgcolor: 'rgba(255,255,255,0.97)',
        boxShadow: '0 20px 60px rgba(15,23,42,0.15)',
        backdropFilter: 'blur(14px)',
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

          <Button type="submit" isLoading={submitting} disabled={submitting || !supabase} size="large">
            {AUTH_COPY[mode].cta}
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Este fluxo usa o Authentication do plano free do Supabase. Configure as políticas no dashboard para liberar o acesso
          público e, se desejar, personalize os e-mails transacionais.
        </Typography>
      </Stack>
    </Paper>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="primary">
        Susana IA
      </Typography>
      <Typography variant="h4" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
        {subtitle}
      </Typography>
    </Stack>
  )
}

function useSmoothScroll() {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
    })

    let animationFrame: number

    const raf = (time: number) => {
      lenis.raf(time)
      animationFrame = requestAnimationFrame(raf)
    }

    animationFrame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(animationFrame)
      lenis.destroy()
    }
  }, [prefersReducedMotion])
}
