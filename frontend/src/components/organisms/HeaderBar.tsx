"use client"
import React from 'react'
import AppBar from '@mui/material/AppBar'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import NavBar from '../molecules/NavBar'

export default function HeaderBar() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        top: 0,
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: 'rgba(248, 250, 255, 0.85)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            minHeight: 72,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h6" color="primary" fontWeight={700}>
            Analytica Agents
          </Typography>
          <NavBar />
        </Toolbar>
      </Container>
    </AppBar>
  )
}

