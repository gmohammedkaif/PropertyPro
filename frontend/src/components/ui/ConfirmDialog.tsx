import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useConfirmStore } from '@/stores/confirmStore'
import { EnhancedButton } from '@/components/ui/EnhancedButton'

const backDrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const sheet = {
  hidden: { opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 16px)' },
  visible: { opacity: 1, scale: 1, x: '-50%', y: '-50%' },
  exit: { opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% + 8px)' },
}

export function ConfirmDialog() {
  const { isOpen, title, message, confirmLabel, cancelLabel, confirm, cancel } = useConfirmStore()

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) cancel() }}>
      <AnimatePresence>
        {isOpen ? (
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
                className="bg-[#193347] border border-[rgba(183,199,214,0.18)] backdrop-blur-2xl fixed left-1/2 top-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
              >
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger border border-danger/20">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-text">
                      {title}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="text-sm text-text2 leading-relaxed">
                      {message}
                    </DialogPrimitive.Description>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2 shrink-0">
                  <EnhancedButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={cancel}
                    className="h-10 px-4 text-xs font-semibold"
                  >
                    {cancelLabel}
                  </EnhancedButton>
                  <EnhancedButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={confirm}
                    className="h-10 px-4 text-xs font-semibold shadow-sm hover:shadow-md"
                  >
                    {confirmLabel}
                  </EnhancedButton>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
