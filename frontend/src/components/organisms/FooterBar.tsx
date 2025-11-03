"use client"
import React from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function FooterBar() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Copyright {new Date().getFullYear()} Analytica Agents - Susana IA
        </Typography>
      </Container>
    </Box>
  )
}
