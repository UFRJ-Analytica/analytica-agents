"use client"

import Link from 'next/link'
import React from 'react'
import { ArrowRight } from 'lucide-react'
import LandingButton from '../../atoms/LandingButton'
import { type AuthMode } from '../AuthModal'

type Props = {
  onAuthClick?: (mode?: AuthMode) => void
  isAuthenticated?: boolean
}

export default function CtaSection({ onAuthClick, isAuthenticated }: Props) {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-700 to-brand-900 p-12 text-center shadow-2xl shadow-brand-900/20 md:p-24">
          <div className="absolute -left-24 -bottom-24 -z-10 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl"></div>
          <div className="absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl"></div>
          <div className="absolute left-1/2 top-0 -z-10 h-full w-full -translate-x-1/2 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500/20 via-transparent to-transparent blur-2xl"></div>

          <h2 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-6xl">
            Sua gestão, <br />
            <span className="text-brand-200">inteligente de verdade.</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-brand-100 md:text-xl">
            Não deixe seus dados parados. Transforme registros em resultados e leve sua instituição para a era da Saúde
            4.0 hoje mesmo.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isAuthenticated ? (
              <>
                <LandingButton
                  asChild
                  variant="secondary"
                  size="lg"
                  className="h-14 w-full px-8 font-bold text-brand-900 transition-transform hover:scale-105 sm:w-auto"
                >
                  <Link href="/chat">Abrir Susana IA</Link>
                </LandingButton>
                <LandingButton
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 w-full border-white/30 px-8 text-white hover:bg-white/10 sm:w-auto"
                >
                  <Link href="/map">Ver Mapa</Link>
                </LandingButton>
              </>
            ) : (
              <>
                <LandingButton
                  variant="secondary"
                  size="lg"
                  className="h-14 w-full px-8 font-bold text-brand-900 transition-transform hover:scale-105 sm:w-auto"
                  onClick={() => onAuthClick?.('signup')}
                >
                  Agendar Demonstração
                </LandingButton>
                <LandingButton
                  variant="outline"
                  size="lg"
                  className="h-14 w-full border-white/30 px-8 text-white hover:bg-white/10 sm:w-auto"
                  onClick={() => onAuthClick?.('signin')}
                >
                  Falar com Especialista <ArrowRight className="ml-2 h-4 w-4" />
                </LandingButton>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
