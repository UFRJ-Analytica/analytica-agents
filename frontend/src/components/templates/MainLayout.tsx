"use client"
import React from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { usePathname } from 'next/navigation'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import HeaderBar from '../organisms/HeaderBar'
import FooterBar from '../organisms/FooterBar'
import theme from '../../theme'

type Props = { children: React.ReactNode }

export default function MainLayout({ children }: Props) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/'

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLandingPage ? (
        <Box component="main">{children}</Box>
      ) : (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background:
              'linear-gradient(180deg, rgba(236,243,255,0.65) 0%, rgba(245,247,251,0.9) 40%, rgba(249,249,255,1) 100%)',
          }}
        >
          <HeaderBar />
          <Box component="main" sx={{ flex: 1, py: { xs: 4, md: 6 } }}>
            <Container maxWidth="lg">{children}</Container>
          </Box>
          <FooterBar />
        </Box>
      )}
    </ThemeProvider>
  )
}
