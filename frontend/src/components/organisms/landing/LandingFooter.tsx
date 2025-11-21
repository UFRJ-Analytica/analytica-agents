import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Linkedin, Twitter, Mail } from 'lucide-react'
import SusanaLogo from '../../../../assets/images/Susana IA Logo.png'

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white pb-10 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-5">
          <div className="col-span-1 pr-0 md:col-span-2 md:pr-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
                <Image src={SusanaLogo} alt="Susana IA" width={36} height={36} className="h-9 w-9 object-contain" />
              </div>
              <span className="text-xl font-bold text-slate-900">Susana IA</span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              Plataforma líder em inteligência artificial generativa para o setor de saúde. Unificamos dados, otimizamos
              recursos e apoiamos decisões que salvam vidas.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-brand-600 hover:bg-brand-600 hover:text-white"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-brand-600 hover:bg-brand-600 hover:text-white"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:contato@susana.ai"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-brand-600 hover:bg-brand-600 hover:text-white"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-slate-900">Soluções</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <a href="#" className="transition-colors hover:text-brand-600">
                  Gestão de Leitos
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-600">
                  Triagem Preditiva
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-600">
                  Prontuário IA
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-600">
                  Auditoria Médica
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-slate-900">Empresa</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <a href="#" className="transition-colors hover:text-brand-600">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-600">
                  Carreiras
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-600">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-brand-600">
                  Imprensa
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-bold text-slate-900">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link href="#" className="transition-colors hover:text-brand-600">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-brand-600">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-brand-600">
                  Compliance
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-brand-600">
                  Segurança
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 text-center">
          <p className="text-sm text-slate-400">
            © 2024 Susana IA Tecnologia em Saúde Ltda. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
