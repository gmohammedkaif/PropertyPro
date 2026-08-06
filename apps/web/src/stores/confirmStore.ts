import { create } from 'zustand'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

// Store the resolve callback outside of Zustand state (not serializable)
let _resolve: ((value: boolean) => void) | null = null

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
  confirm: () => void
  cancel: () => void
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',

  showConfirm: ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) => {
    set({ isOpen: true, title, message, confirmLabel, cancelLabel })
    return new Promise<boolean>((resolve) => {
      _resolve = resolve
    })
  },

  confirm: () => {
    if (_resolve) {
      _resolve(true)
      _resolve = null
    }
    set({ isOpen: false })
  },

  cancel: () => {
    if (_resolve) {
      _resolve(false)
      _resolve = null
    }
    set({ isOpen: false })
  },
}))
