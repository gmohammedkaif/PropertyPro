import { useEffect } from 'react'

import { restoreSession } from '@/lib/authSession'

export function SessionRestore() {
  useEffect(() => {
    void restoreSession()
  }, [])
  return null
}