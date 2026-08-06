import type { PropsWithChildren } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'

import { queryClient } from '@/lib/queryClient'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ToastContainer } from '@/components/ui/Toast'

/**
 * Global application providers. Order matters: outer providers wrap inner ones.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        {children}
        <ConfirmDialog />
        <ToastContainer />
      </QueryClientProvider>
    </MotionConfig>
  )
}
