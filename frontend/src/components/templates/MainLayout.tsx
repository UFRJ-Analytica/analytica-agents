"use client"
import React from 'react'
import HeaderBar from '../organisms/HeaderBar'
import FooterBar from '../organisms/FooterBar'

type Props = { children: React.ReactNode }

export default function MainLayout({ children }: Props) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderBar />
      <div style={{ flex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px' }}>
          {children}
        </div>
      </div>
      <FooterBar />
    </div>
  )
}

