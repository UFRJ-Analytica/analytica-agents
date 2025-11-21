import type { Metadata } from 'next'
import '../styles/globals.css'
import MainLayout from '../src/components/templates/MainLayout'
import AuthProvider from '../src/components/providers/AuthProvider'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Susana IA | Saúde + Inteligência',
  description: 'Landing e apps (Mapa, DataSUS Rio, Susana IA) com IA generativa para gestão em saúde.',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
