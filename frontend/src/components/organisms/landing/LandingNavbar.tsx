"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import LandingButton from '../../atoms/LandingButton'
import SusanaLogo from '../../../../assets/images/Susana IA Logo.png'

type Props = {
  onSignIn: () => void
  onSignUp: () => void
}

const LANDING_LINKS = [
  { href: '#solucoes', label: 'Soluções' },
  { href: '#narrativa', label: 'Como Funciona' },
  { href: '#metricas', label: 'Resultados' },
]

const APP_LINKS = [
  { href: '/map', label: 'Mapa' },
  { href: '/cloropleth', label: 'DataSUS Rio' },
  { href: '/chat', label: 'Susana IA' },
]

export default function LandingNavbar({ onSignIn, onSignUp }: Props) {
  const { session, signOut } = useAuth()
  const isAuthenticated = useMemo(() => Boolean(session), [session])
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = isAuthenticated ? APP_LINKS : LANDING_LINKS
  const handleSignOut = () => {
    void signOut()
  }
  const handleCloseMenu = () => setIsMobileMenuOpen(false)
  const handleMobileSignIn = () => {
    onSignIn()
    handleCloseMenu()
  }
  const handleMobileSignUp = () => {
    onSignUp()
    handleCloseMenu()
  }
  const handleMobileSignOut = () => {
    void signOut()
    handleCloseMenu()
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`relative w-full max-w-7xl rounded-2xl transition-all duration-300 ${
          isScrolled
            ? 'border border-slate-200/60 bg-white/85 px-4 py-3 shadow-lg backdrop-blur-lg md:px-6'
            : 'bg-transparent px-4 py-5'
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-white/60"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 shadow-lg shadow-brand-500/10 ring-1 ring-brand-100">
              <Image src={SusanaLogo} alt="Susana IA" width={32} height={32} className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">
              susana<span className="text-brand-600">.IA</span>
            </span>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
                >
                  {link.label}
                </Link>
              ),
            )}

            {!isAuthenticated ? (
              <div className="ml-4 flex gap-3">
                <LandingButton variant="ghost" size="sm" onClick={onSignIn}>
                  Entrar
                </LandingButton>
                <LandingButton variant="primary" size="sm" onClick={onSignUp}>
                  Agendar Demo
                </LandingButton>
              </div>
              ) : (
              <div className="ml-4 flex gap-3">
                <LandingButton asChild variant="secondary" size="sm">
                  <Link href="/chat">Abrir Susana IA</Link>
                </LandingButton>
                <LandingButton variant="ghost" size="sm" onClick={handleSignOut}>
                  Sair
                </LandingButton>
              </div>
            )}
          </div>

          <button
            className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Abrir menu"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:hidden">
            {links.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleCloseMenu}
                  className="py-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleCloseMenu}
                  className="py-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
                >
                  {link.label}
                </Link>
              ),
            )}
            <hr className="border-slate-100" />
            {!isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <LandingButton variant="ghost" className="w-full justify-start" onClick={handleMobileSignIn}>
                  Entrar
                </LandingButton>
                <LandingButton variant="primary" className="w-full" onClick={handleMobileSignUp}>
                  Agendar Demo
                </LandingButton>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <LandingButton asChild variant="secondary" className="w-full">
                  <Link href="/chat" onClick={handleCloseMenu}>
                    Abrir Susana IA
                  </Link>
                </LandingButton>
                <LandingButton variant="ghost" className="w-full justify-start" onClick={handleMobileSignOut}>
                  Sair
                </LandingButton>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
