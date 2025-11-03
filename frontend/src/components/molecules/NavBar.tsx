"use client"
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Stack from '@mui/material/Stack'
import Button from '../atoms/Button'

const LINKS = [
  { href: '/', label: 'Início' },
  { href: '/map', label: 'Mapa' },
  { href: '/chat', label: 'Susana IA' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <Stack direction="row" spacing={1}>
      {LINKS.map((link) => {
        const isActive = pathname === link.href
        return (
          <Button
            key={link.href}
            component={Link}
            href={link.href}
            variant={isActive ? 'contained' : 'text'}
            color={isActive ? 'primary' : 'inherit'}
            size="small"
            sx={{
              borderRadius: 999,
              fontWeight: 600,
              px: 2.5,
              py: 0.75,
              bgcolor: isActive ? 'primary.main' : 'transparent',
            }}
          >
            {link.label}
          </Button>
        )
      })}
    </Stack>
  )
}
