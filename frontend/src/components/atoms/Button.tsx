"use client"
import React from 'react'
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

type ButtonProps = MuiButtonProps & {
  isLoading?: boolean
}

export default function Button({
  isLoading = false,
  children,
  disabled,
  variant = 'contained',
  color = 'primary',
  ...props
}: ButtonProps) {
  return (
    <MuiButton
      variant={variant}
      color={color}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />}
      {children}
    </MuiButton>
  )
}

