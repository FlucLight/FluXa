import { createContext } from 'react'
import type { ToastType } from './toast-types'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastMessage {
  id: string
  title?: string
  message: string
  type: ToastType
  action?: ToastAction
  duration?: number
}

export interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string, action?: ToastAction, duration?: number) => void
  success: (message: string, title?: string, action?: ToastAction, duration?: number) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string, action?: ToastAction, duration?: number) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)
