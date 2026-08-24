import type { ReactNode } from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const modalSizes = cva('', {
  variants: {
    size: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
})

export interface ModalProps extends VariantProps<typeof modalSizes> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

const backDrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const sheet = {
  hidden: { opacity: 0, scale: 0.97, x: '-50%', y: 'calc(-50% + 16px)' },
  visible: { opacity: 1, scale: 1, x: '-50%', y: '-50%' },
  exit: { opacity: 0, scale: 0.98, x: '-50%', y: 'calc(-50% + 8px)' },
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size,
  className,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={backDrop.hidden}
                animate={backDrop.visible}
                exit={backDrop.hidden}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="modal-blur-bg fixed inset-0 z-[var(--z-overlay)]"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                initial={sheet.hidden}
                animate={sheet.visible}
                exit={sheet.exit}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'bg-surface border border-border',
                  'fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] rounded-xl',
                  'shadow-xl',
                  'flex flex-col max-h-[90vh]',
                  modalSizes({ size }),
                  className,
                )}
              >
                {/* Sticky Header */}
                <div className="flex items-start justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-border shrink-0">
                  <div className="flex flex-col gap-0.5">
                    {title ? (
                      <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-text">
                        {title}
                      </DialogPrimitive.Title>
                    ) : null}
                    {description ? (
                      <DialogPrimitive.Description className="text-xs sm:text-sm text-muted">
                        {description}
                      </DialogPrimitive.Description>
                    ) : null}
                  </div>

                  <DialogPrimitive.Close asChild>
                    <button
                      type="button"
                      aria-label="Close dialog"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-all duration-150 hover:bg-surface3 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </DialogPrimitive.Close>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 custom-scrollbar">
                  {children}
                </div>

                {/* Sticky Footer */}
                {footer ? (
                  <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-wrap items-center justify-end gap-2">
                    {footer}
                  </div>
                ) : null}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
