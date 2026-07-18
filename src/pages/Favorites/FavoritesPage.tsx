import { useNavigate } from 'react-router-dom'
import { useFavorites } from '../../store/favorites'
import { CALCULATOR_ROUTES } from '../../utils/calculatorRoutes'
import styles from './FavoritesPage.module.css'

function IconStar() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(ts))
}

export default function FavoritesPage() {
  const { items, remove } = useFavorites()
  const navigate = useNavigate()

  function openCalculator(calculatorId: string, inputs: Record<string, string>) {
    const route = CALCULATOR_ROUTES[calculatorId]
    if (!route) return
    navigate(route, { state: { inputs } })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Favorites</h1>
        <span className={styles.count}>{items.length}</span>
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><IconStar /></span>
          <p className={styles.emptyText}>No favorites yet</p>
          <p className={styles.emptyHint}>Tap the ★ icon inside any calculator after calculating to save it here.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li
              key={item.id}
              className={[styles.card, styles.cardClickable].join(' ')}
              onClick={() => openCalculator(item.calculatorId, item.inputs)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openCalculator(item.calculatorId, item.inputs)}
            >
              <div className={styles.cardTop}>
                <div>
                  <span className={styles.calculatorName}>{item.calculatorName}</span>
                  <p className={styles.result}>{item.result}</p>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); remove(item.id) }}
                  aria-label="Remove favorite"
                >
                  <IconTrash />
                </button>
              </div>
              <span className={styles.date}>{formatDate(item.savedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
