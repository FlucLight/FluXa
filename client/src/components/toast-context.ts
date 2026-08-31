import { createContext } from 'react'
import type { ToastType } from './toast-types'

export interface ToastMessage {
  id: string
  title?: string
  message: string
  type: ToastType
}

export interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)
