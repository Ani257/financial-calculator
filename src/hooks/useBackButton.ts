import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Wire Capacitor's Android hardware back-button to React Router.
 * On the root route (/) it minimises the app instead of navigating back.
 * Silently no-ops in web dev mode where @capacitor/app is unavailable.
 */
export function useBackButton() {
  const navigate = useNavigate()

  useEffect(() => {
    let cleanup: (() => void) | undefined

    import('@capacitor/app')
      .then(({ App }) => {
        App.addListener('backButton', (info: { canGoBack: boolean }) => {
          if (info.canGoBack) {
            navigate(-1)
          } else {
            App.minimizeApp()
          }
        }).then((handle: { remove: () => void }) => {
          cleanup = () => handle.remove()
        })
      })
      .catch(() => {
        // Not running inside Capacitor (web dev mode) — no-op
      })

    return () => cleanup?.()
  }, [navigate])
}
