import type { Metadata } from 'next'
import '../styles/globals.css'
import MainLayout from '../src/components/templates/MainLayout'

export const metadata: Metadata = {
  title: 'Analytica Agents',
  description: 'Mapa e Susana IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}
