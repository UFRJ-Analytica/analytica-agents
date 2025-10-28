"use client"
import React from 'react'
import Link from 'next/link'
import Card from '../atoms/Card'

type Props = {
  href: string
  title: string
  description?: string
}

export default function CardLink({ href, title, description }: Props) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card>
        <h3 style={{ marginTop: 0 }}>{title} →</h3>
        {description && <p style={{ marginBottom: 0 }}>{description}</p>}
      </Card>
    </Link>
  )
}

