"use client"
import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default'
}

export default function Button({ variant = 'default', style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    background: variant === 'primary' ? '#1677ff' : '#fff',
    color: variant === 'primary' ? '#fff' : '#111',
    cursor: 'pointer',
  }
  return <button {...props} style={{ ...base, ...style }} />
}

