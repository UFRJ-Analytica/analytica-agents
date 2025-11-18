import type { Metadata } from 'next'
import '../styles/globals.css'
import MainLayout from '../src/components/templates/MainLayout'
import AuthProvider from '../src/components/providers/AuthProvider'

export const metadata: Metadata = {
  title: 'Susana IA',
  description: 'Mapa e Susana IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
