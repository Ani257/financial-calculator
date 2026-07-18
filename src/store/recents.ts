import { create } from 'zustand'
import { Preferences } from '@capacitor/preferences'

export interface RecentEntry {
  id: string
  calculatorId: string
  calculatorName: string
  label: string
  result: string
  inputs: Record<string, string>
  calculatedAt: number
}

const MAX_RECENTS = 50
const STORAGE_KEY = 'fincalc_recents'

interface RecentsState {
  items: RecentEntry[]
  loaded: boolean
  load: () => Promise<void>
  push: (entry: Omit<RecentEntry, 'id' | 'calculatedAt'>) => Promise<void>
  clear: () => Promise<void>
}

async function persist(items: RecentEntry[]) {
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(items) })
}

export const useRecents = create<RecentsState>((set, get) => ({
  items: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY })
      const items: RecentEntry[] = value ? JSON.parse(value) : []
      set({ items, loaded: true })
    } catch {
      set({ items: [], loaded: true })
    }
  },

  push: async (entry) => {
    const newItem: RecentEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      calculatedAt: Date.now(),
    }
    const items = [newItem, ...get().items].slice(0, MAX_RECENTS)
    set({ items })
    await persist(items)
  },

  clear: async () => {
    set({ items: [] })
    await Preferences.remove({ key: STORAGE_KEY })
  },
}))
