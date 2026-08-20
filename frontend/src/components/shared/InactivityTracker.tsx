import { useEffect, useRef } from 'react'
import { AUTH_STORAGE_KEY, INACTIVITY_STORAGE_KEY, INACTIVITY_TIMEOUT_MS } from '@/shared'
import { logout } from '@/lib/authSession'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

interface InactivityTrackerProps {
  /** Optional custom timeout in ms (defaults to production 1 hour) */
  timeoutMs?: number
}

const THROTTLE_MS = 2000 // Only update localStorage / state at most once every 2 seconds
const CHECK_INTERVAL_MS = 10_000 // Check inactivity status every 10 seconds

export function InactivityTracker({ timeoutMs = INACTIVITY_TIMEOUT_MS }: InactivityTrackerProps) {
  const user = useAuthStore((state) => state.user)
  const lastActivityRef = useRef<number>(Date.now())
  const lastWriteRef = useRef<number>(0)
  const isLoggingOutRef = useRef<boolean>(false)

  const getLatestTimestamp = (): number => {
    try {
      const stored = localStorage.getItem(INACTIVITY_STORAGE_KEY)
      if (stored) {
        const parsed = Number(stored)
        if (!isNaN(parsed) && parsed > 0) {
          return Math.max(parsed, lastActivityRef.current)
        }
      }
    } catch {
      /* ignore storage errors */
    }
    return lastActivityRef.current
  }

  const triggerInactivityLogout = async () => {
    if (isLoggingOutRef.current || !useAuthStore.getState().user) return
    isLoggingOutRef.current = true

    try {
      sessionStorage.setItem('propertypro_session_expired', 'inactivity')
    } catch {
      /* ignore storage errors */
    }

    try {
      await logout()
    } catch {
      useAuthStore.getState().signOut()
    }
  }

  const checkInactivity = () => {
    if (!user || isLoggingOutRef.current) return
    const latest = getLatestTimestamp()
    const elapsed = Date.now() - latest
    if (elapsed >= timeoutMs) {
      void triggerInactivityLogout()
    }
  }

  useEffect(() => {
    if (!user) return

    // Ensure initial timestamp is saved on mount/auth
    const now = Date.now()
    lastActivityRef.current = now
    try {
      const existing = localStorage.getItem(INACTIVITY_STORAGE_KEY)
      if (!existing) {
        localStorage.setItem(INACTIVITY_STORAGE_KEY, now.toString())
      } else {
        const parsed = Number(existing)
        if (!isNaN(parsed) && parsed > 0) {
          lastActivityRef.current = parsed
        }
      }
    } catch {
      /* ignore storage error */
    }

    // Initial check on mount
    checkInactivity()

    // ── Activity Handler ────────────────────────────────────────────────────────
    const handleUserActivity = () => {
      const currentTime = Date.now()
      lastActivityRef.current = currentTime

      if (currentTime - lastWriteRef.current >= THROTTLE_MS) {
        lastWriteRef.current = currentTime
        try {
          localStorage.setItem(INACTIVITY_STORAGE_KEY, currentTime.toString())
        } catch {
          /* ignore storage error */
        }
      }
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'pointerdown',
    ]

    activityEvents.forEach((eventType) => {
      window.addEventListener(eventType, handleUserActivity, { passive: true })
    })

    // ── Resume / Focus / Visibility Handler ──────────────────────────────────────
    const handleResumeOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity()
      }
    }

    window.addEventListener('visibilitychange', handleResumeOrFocus)
    window.addEventListener('focus', handleResumeOrFocus)

    // ── Cross-Tab Storage Event Handler ─────────────────────────────────────────
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === INACTIVITY_STORAGE_KEY && e.newValue) {
        const parsed = Number(e.newValue)
        if (!isNaN(parsed)) {
          lastActivityRef.current = parsed
        }
      } else if (e.key === AUTH_STORAGE_KEY) {
        // If another tab logged out, check if user session was cleared
        if (!e.newValue || !useAuthStore.getState().user) {
          // If inactivity caused the logout in another tab, mark session expired for this tab as well
          const latest = getLatestTimestamp()
          if (Date.now() - latest >= timeoutMs) {
            try {
              sessionStorage.setItem('propertypro_session_expired', 'inactivity')
            } catch {
              /* ignore storage errors */
            }
          }
          useAuthStore.getState().signOut()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // ── Periodic Check Interval ─────────────────────────────────────────────────
    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS)

    // ── Cleanup ────────────────────────────────────────────────────────────────
    return () => {
      activityEvents.forEach((eventType) => {
        window.removeEventListener(eventType, handleUserActivity)
      })
      window.removeEventListener('visibilitychange', handleResumeOrFocus)
      window.removeEventListener('focus', handleResumeOrFocus)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(intervalId)
    }
  }, [user, timeoutMs])

  return null
}
