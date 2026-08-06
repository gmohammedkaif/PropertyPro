import type { ReactNode } from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: 'left' | 'right'
  className?: string
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  className,
}: DrawerProps) {
  const from = side === 'right' ? '100%' : '-100%'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="fixed inset-0 z-[var(--z-overlay)] bg-black/45 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                initial={{ x: from }}
                animate={{ x: 0 }}
                exit={{ x: from }}
                transition={{ type: 'spring', damping: 30, stiffness: 340 }}
                className={cn(
                  'glass fixed inset-y-0 z-[var(--z-modal)] flex w-full max-w-sm flex-col shadow-xl',
                  side === 'right' ? 'right-0' : 'left-0',
                  className,
                )}
              >
                {title || description ? (
                  <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      {title ? (
                        <DialogPrimitive.Title className="text-base font-semibold text-text">
                          {title}
                        </DialogPrimitive.Title>
                      ) : null}
                      {description ? (
                        <DialogPrimitive.Description className="text-sm text-muted">
                          {description}
                        </DialogPrimitive.Description>
                      ) : null}
                    </div>
                    <DialogPrimitive.Close asChild>
                      <button
                        type="button"
                        aria-label="Close panel"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface2 hover:text-text"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </DialogPrimitive.Close>
                  </div>
                ) : null}

                <div className="flex-1 overflow-y-auto">{children}</div>

                {footer ? <div className="border-t border-border px-5 py-4">{footer}</div> : null}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
