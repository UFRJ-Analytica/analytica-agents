"use client"
import React from 'react'
import NavBar from '../molecules/NavBar'

export default function HeaderBar() {
  return (
    <header style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #eee', zIndex: 10 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 600 }}>Analytica Agents</div>
        <NavBar />
      </div>
    </header>
  )
}

