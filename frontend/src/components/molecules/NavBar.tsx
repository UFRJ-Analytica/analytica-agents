"use client"
import React from 'react'
import Link from 'next/link'

export default function NavBar() {
  const linkStyle: React.CSSProperties = { textDecoration: 'none', color: '#111', padding: '8px 10px', borderRadius: 6 }
  return (
    <nav style={{ display: 'flex', gap: 8 }}>
      <Link href="/" style={linkStyle}>Início</Link>
      <Link href="/map" style={linkStyle}>Mapa</Link>
      <Link href="/chat" style={linkStyle}>Susana IA</Link>
    </nav>
  )
}

