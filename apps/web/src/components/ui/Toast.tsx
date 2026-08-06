import { useEffect, useRef, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useToastStore, type Toast, type ToastIntent } from '@/stores/toastStore'

// ─── Icon map ────────────────────────────────────────────────────────────────

const INTENT_META: Record<
  ToastIntent,
  { icon: React.ElementType; colorClass: string; barClass: string }
> = {
  success: {
    icon: CheckCircle2,
    colorClass: 'text-success',
    barClass: 'bg-success',
  },
  error: {
    icon: AlertCircle,
    colorClass: 'text-danger',
    barClass: 'bg-danger',
  },
  warning: {
    icon: AlertTriangle,
    colorClass: 'text-warning',
    barClass: 'bg-warning',
  },
  info: {
    icon: Info,
    colorClass: 'text-info',
    barClass: 'bg-info',
  },
}

// ─── Single toast item ────────────────────────────────────────────────────────

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((state) => state.removeToast)
  const [progress, setProgress] = useState(100)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number>(Date.now())

  const { icon: Icon, colorClass, barClass } = INTENT_META[toast.intent]

  useEffect(() => {
    startRef.current = Date.now()
    const tick = 50 // ms per frame
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100)
      setProgress(remaining)
      if (remaining === 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        removeToast(toast.id)
      }
    }, tick)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [toast.id, toast.duration, removeToast])

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="glass relative flex w-full max-w-sm flex-col overflow-hidden rounded-xl shadow-lg"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        <span className={cn('mt-0.5 shrink-0', colorClass)} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 text-xs text-muted">{toast.description}</p>
          ) : null}
          {toast.action ? (
            <button
              type="button"
              onClick={() => {
                toast.action!.onClick()
                removeToast(toast.id)
              }}
              className={cn(
                'mt-2 text-xs font-semibold underline-offset-2 hover:underline',
                colorClass,
              )}
            >
              {toast.action.label}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => removeToast(toast.id)}
          className="ml-1 shrink-0 rounded-md p-0.5 text-muted transition-colors hover:bg-surface2 hover:text-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div
        aria-hidden="true"
        className={cn('h-0.5 transition-none', barClass)}
        style={{ width: `${progress}%` }}
      />
    </motion.li>
  )
}

// ─── Container ────────────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <ol
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col-reverse items-end gap-2 sm:bottom-6 sm:right-6"
      style={{ maxWidth: 'min(100vw - 2rem, 384px)' }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </ol>
  )
}
