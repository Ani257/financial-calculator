import { useNavigate } from 'react-router-dom'
import styles from '../CategoryPage.module.css'

function IconChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

const calculators = [
  {
    id: 'burn-rate',
    name: 'Burn Rate',
    description: 'Monthly net cash outflow and how long your runway lasts.',
    available: true,
  },
  {
    id: 'break-even',
    name: 'Break-Even',
    description: 'The unit volume and revenue at which total costs equal total income.',
    available: true,
  },
  {
    id: 'cash-runway',
    name: 'Cash Runway',
    description: 'How long your current cash will last at the current burn rate.',
    available: false,
  },
]

export default function BusinessPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className={styles.title}>Business</h1>
      </header>

      <ul className={styles.list}>
        {calculators.map((calc) => (
          <li key={calc.id}>
            <button
              className={[styles.item, !calc.available ? styles.itemDisabled : ''].filter(Boolean).join(' ')}
              onClick={() => calc.available && navigate(`/business/${calc.id}`)}
              disabled={!calc.available}
            >
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>
                  {calc.name}
                  {!calc.available && <span className={styles.soon}>Soon</span>}
                </span>
                <span className={styles.itemDesc}>{calc.description}</span>
              </div>
              {calc.available && (
                <span className={styles.chevron}><IconChevronRight /></span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
