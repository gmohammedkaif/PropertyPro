import { useCallback } from 'react'

import { useToastStore, type ToastIntent } from '@/stores/toastStore'

interface ToastOptions {
  description?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

function useToast() {
  const addToast = useToastStore((state) => state.addToast)
  const removeToast = useToastStore((state) => state.removeToast)

  const show = useCallback(
    (intent: ToastIntent, title: string, options?: ToastOptions) =>
      addToast({
        intent,
        title,
        description: options?.description,
        duration: options?.duration ?? (intent === 'error' ? 6000 : 4000),
        action: options?.action,
      }),
    [addToast],
  )

  return {
    success: (title: string, options?: ToastOptions) => show('success', title, options),
    error: (title: string, options?: ToastOptions) => show('error', title, options),
    warning: (title: string, options?: ToastOptions) => show('warning', title, options),
    info: (title: string, options?: ToastOptions) => show('info', title, options),
    dismiss: removeToast,
  }
}

export { useToast }
