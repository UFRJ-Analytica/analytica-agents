"use client"
import React from 'react'
import TextField, { TextFieldProps } from '@mui/material/TextField'

type Props = TextFieldProps

export default function TextInput({ size = 'small', fullWidth = true, ...props }: Props) {
  return (
    <TextField
      size={size}
      fullWidth={fullWidth}
      variant={props.variant ?? 'outlined'}
      {...props}
    />
  )
}

