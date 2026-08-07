import { useEffect, useMemo, useState } from 'react'

import type { ThemeMode } from '@/shared'

import { useThemeStore } from '@/stores/themeStore'

type ResolvedTheme = 'light' | 'dark'

function resolveMode(mode: ThemeMode, systemDark: boolean): ResolvedTheme {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
}

/** Applies the active theme to `<html data-theme>` and keeps `system` in sync. */
export function useTheme() {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  const [systemDark, setSystemDark] = useState<boolean>(
    () =>
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', resolveMode(mode, systemDark))

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)

    return () => media.removeEventListener('change', onChange)
  }, [mode, systemDark])

  const isDark = useMemo(() => resolveMode(mode, systemDark) === 'dark', [mode, systemDark])

  return { mode, setMode, isDark }
}
