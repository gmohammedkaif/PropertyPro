import type { ReactNode } from 'react'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const modalVariants = cva(
  'glass fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col transform-gpu',
  {
    variants: {
      size: {
        sm: 'max-w-sm rounded-2xl',
        md: 'max-w-md rounded-2xl',
        lg: 'max-w-lg rounded-2xl',
        xl: 'max-w-xl rounded-2xl',
        '2xl': 'max-w-2xl rounded-2xl',
        full: 'max-w-[95vw] rounded-2xl',
      },
      withGlow: {
        true: 'shadow-xl',
        false: 'shadow-lg',
      },
    },
    defaultVariants: {
      size: 'lg',
      withGlow: true,
    },
  },
)

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const sheetVariants = {
  hidden: { opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 16px)' },
  visible: { opacity: 1, scale: 1, x: '-50%', y: '-50%' },
  exit: { opacity: 0, scale: 0.98, x: '-50%', y: 'calc(-50% + 8px)' },
}

export interface EnhancedModalProps extends VariantProps<typeof modalVariants> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  withCloseButton?: boolean
  withOverlay?: boolean
  animated?: boolean
}

export function EnhancedModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size,
  withGlow,
  className,
  withCloseButton = true,
  withOverlay = true,
  animated: _animated = true,
}: EnhancedModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence mode="sync">
        {open ? (
          <DialogPrimitive.Portal forceMount>
            {withOverlay && (
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={backdropVariants.hidden}
                  animate={backdropVariants.visible}
                  exit={backdropVariants.hidden}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="modal-blur-bg fixed inset-0 z-[var(--z-overlay)]"
                  onClick={() => onOpenChange(false)}
                />
              </DialogPrimitive.Overlay>
            )}

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                initial={sheetVariants.hidden}
                animate={sheetVariants.visible}
                exit={sheetVariants.exit}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={cn(modalVariants({ size, withGlow }), 'modal-glass', className)}
                onClick={(e) => e.stopPropagation()}
              >
                {(title || description) && (
                  <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border/40 shrink-0">
                    <div className="flex-1">
                      {title && (
                        <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-text">
                          {title}
                        </DialogPrimitive.Title>
                      )}
                      {description && (
                        <DialogPrimitive.Description className="mt-0.5 text-sm text-muted">
                          {description}
                        </DialogPrimitive.Description>
                      )}
                    </div>
                    {withCloseButton && (
                      <DialogPrimitive.Close asChild>
                        <button
                          type="button"
                          aria-label="Close modal"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-all duration-200 hover:bg-surface2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </DialogPrimitive.Close>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
                  {children}
                </div>

                {footer && (
                  <div className="shrink-0 px-6 py-4 border-t border-border/40 flex items-center justify-end gap-2">
                    {footer}
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

export const Modal = EnhancedModal
