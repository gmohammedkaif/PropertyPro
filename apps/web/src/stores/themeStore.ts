import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { THEME_STORAGE_KEY, type ThemeMode } from '@propertypro/shared'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    { name: THEME_STORAGE_KEY },
  ),
)
