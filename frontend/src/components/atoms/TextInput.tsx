"use client"
import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export default function TextInput(props: Props) {
  const base: React.CSSProperties = {
    padding: 8,
    borderRadius: 6,
    border: '1px solid #ddd',
  }
  return <input {...props} style={{ ...base, ...(props.style || {}) }} />
}

