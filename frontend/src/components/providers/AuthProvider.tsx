"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '../../lib/supabaseClient'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  token: string | null
  tokenLoading: boolean
  tokenError: string | null
  refreshToken: () => Promise<void>
  signOut: () => Promise<void>
  isSupabaseConfigured: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(supabase))
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [tokenUserId, setTokenUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return
        setSession(data.session ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setSession(null)
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setToken(null)
        setTokenUserId(null)
        setTokenError(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const refreshToken = useCallback(async () => {
    if (!session) {
      setToken(null)
      setTokenUserId(null)
      return
    }

    setTokenLoading(true)
    setTokenError(null)
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
      if (!res.ok) {
        throw new Error(`Erro ${res.status}`)
      }
      const data = await res.json()
      setToken(typeof data?.access_token === 'string' ? data.access_token : null)
      setTokenUserId(session.user.id)
    } catch (error) {
      console.error('Erro ao gerar token da Susana IA', error)
      setToken(null)
      setTokenUserId(null)
      setTokenError('Nao foi possivel gerar um token agora. Tente novamente em instantes.')
    } finally {
      setTokenLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!session?.user) {
      setToken(null)
      setTokenUserId(null)
      setTokenError(null)
      return
    }
    if (tokenUserId === session.user.id || tokenLoading) {
      return
    }
    refreshToken().catch(() => {})
  }, [session, tokenUserId, tokenLoading, refreshToken])

  const signOut = useCallback(async () => {
    if (!supabase) {
      return
    }
    await supabase.auth.signOut()
    setToken(null)
    setTokenUserId(null)
    setTokenError(null)
  }, [supabase])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      token,
      tokenLoading,
      tokenError,
      refreshToken,
      signOut,
      isSupabaseConfigured: Boolean(supabase),
    }),
    [session, loading, token, tokenLoading, tokenError, refreshToken, signOut, supabase],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
