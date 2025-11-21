"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import AuthModal, { type AuthMode } from '../organisms/AuthModal'
import LandingNavbar from '../organisms/landing/LandingNavbar'
import LandingHero from '../organisms/landing/LandingHero'
import FeaturesSection from '../organisms/landing/FeaturesSection'
import ScrollNarrative from '../organisms/landing/ScrollNarrative'
import MetricsSection from '../organisms/landing/MetricsSection'
import CtaSection from '../organisms/landing/CtaSection'
import LandingFooter from '../organisms/landing/LandingFooter'
import { useAuth } from '../providers/AuthProvider'

export default function LandingPage() {
  const { session } = useAuth()
  const searchParams = useSearchParams()
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  const [authOpen, setAuthOpen] = useState(false)
  const [searchHandled, setSearchHandled] = useState(false)

  useSmoothScroll()

  useEffect(() => {
    if (searchHandled) return
    const authParam = searchParams?.get('auth')
    if (authParam === 'signin' || authParam === 'signup' || authParam === 'reset') {
      setAuthMode(authParam)
      setAuthOpen(true)
      setSearchHandled(true)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('auth')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchHandled, searchParams])

  const handleOpenAuth = useCallback((mode: AuthMode = 'signin') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])

  const isAuthenticated = useMemo(() => Boolean(session), [session])

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <LandingNavbar onSignIn={() => handleOpenAuth('signin')} onSignUp={() => handleOpenAuth('signup')} />
      <main className="overflow-hidden">
        <LandingHero isAuthenticated={isAuthenticated} onAuthClick={handleOpenAuth} />
        <FeaturesSection />
        <ScrollNarrative />
        <MetricsSection />
        <CtaSection onAuthClick={() => handleOpenAuth('signup')} isAuthenticated={isAuthenticated} />
      </main>
      <LandingFooter />

      <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} onModeChange={setAuthMode} />
    </div>
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
