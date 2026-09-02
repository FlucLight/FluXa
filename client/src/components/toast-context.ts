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
}

export interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string, action?: ToastAction) => void
  success: (message: string, title?: string, action?: ToastAction) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string, action?: ToastAction) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)
