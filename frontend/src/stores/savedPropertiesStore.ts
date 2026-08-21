import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SavedPropertiesState {
  savedIds: string[]
  toggleSave: (propertyId: string) => boolean
  isSaved: (propertyId: string) => boolean
}

export const useSavedPropertiesStore = create<SavedPropertiesState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSave: (propertyId) => {
        const { savedIds } = get()
        const exists = savedIds.includes(propertyId)
        const next = exists
          ? savedIds.filter((id) => id !== propertyId)
          : [...savedIds, propertyId]
        set({ savedIds: next })
        return !exists
      },
      isSaved: (propertyId) => get().savedIds.includes(propertyId),
    }),
    {
      name: 'propertypro_saved_properties',
    }
  )
)
