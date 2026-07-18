import { create } from 'zustand'
import { Preferences } from '@capacitor/preferences'

export interface FavoriteEntry {
  id: string
  calculatorId: string
  calculatorName: string
  label: string
  result: string
  inputs: Record<string, string>
  savedAt: number
}

interface FavoritesState {
  items: FavoriteEntry[]
  loaded: boolean
  load: () => Promise<void>
  add: (entry: Omit<FavoriteEntry, 'id' | 'savedAt'>) => Promise<void>
  remove: (id: string) => Promise<void>
  isFavorite: (calculatorId: string, result: string) => boolean
}

const STORAGE_KEY = 'fincalc_favorites'

async function persist(items: FavoriteEntry[]) {
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(items) })
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  items: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY })
      const items: FavoriteEntry[] = value ? JSON.parse(value) : []
      set({ items, loaded: true })
    } catch {
      set({ items: [], loaded: true })
    }
  },

  add: async (entry) => {
    const newItem: FavoriteEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      savedAt: Date.now(),
    }
    const items = [newItem, ...get().items]
    set({ items })
    await persist(items)
  },

  remove: async (id) => {
    const items = get().items.filter((i) => i.id !== id)
    set({ items })
    await persist(items)
  },

  isFavorite: (calculatorId, result) =>
    get().items.some(
      (i) => i.calculatorId === calculatorId && i.result === result
    ),
}))
