"use client"
import React from 'react'

type Props = React.HTMLAttributes<HTMLDivElement>

export default function Card({ style, ...props }: Props) {
  const base: React.CSSProperties = {
    border: '1px solid #eaeaea',
    borderRadius: 8,
    padding: 16,
    background: '#fff',
  }
  return <div {...props} style={{ ...base, ...(style || {}) }} />
}

