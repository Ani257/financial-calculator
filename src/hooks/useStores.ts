import { useEffect } from 'react'
import { useFavorites } from '../store/favorites'
import { useRecents } from '../store/recents'

/**
 * Boot both persistent stores on first mount.
 * Call this once at the app layout level.
 */
export function useBootStores() {
  const loadFavorites = useFavorites((s) => s.load)
  const loadRecents = useRecents((s) => s.load)

  useEffect(() => {
    void loadFavorites()
    void loadRecents()
  }, [loadFavorites, loadRecents])
}
