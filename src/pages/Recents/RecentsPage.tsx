import { useRecents } from '../../store/recents'
import styles from './RecentsPage.module.css'

function IconClock() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function RecentsPage() {
  const { items, clear } = useRecents()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Recents</h1>
        {items.length > 0 && (
          <button className={styles.clearBtn} onClick={clear}>
            Clear all
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><IconClock /></span>
          <p className={styles.emptyText}>No recent calculations</p>
          <p className={styles.emptyHint}>Your last 50 calculations will appear here automatically.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.calculatorName}>{item.calculatorName}</span>
                <span className={styles.time}>{formatRelative(item.calculatedAt)}</span>
              </div>
              <p className={styles.result}>{item.result}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
