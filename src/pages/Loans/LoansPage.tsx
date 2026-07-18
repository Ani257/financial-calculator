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
    id: 'emi',
    name: 'EMI Calculator',
    description: 'Monthly instalment amount for any loan.',
  },
  {
    id: 'amortization',
    name: 'Amortization Schedule',
    description: 'Full month-by-month breakdown of principal and interest.',
  },
  {
    id: 'debt-consolidation',
    name: 'Debt Consolidation',
    description: 'Compare multiple debts against a single consolidation loan.',
  },
]

export default function LoansPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className={styles.title}>Loans</h1>
      </header>

      <ul className={styles.list}>
        {calculators.map((calc) => (
          <li key={calc.id}>
            <button
              className={styles.item}
              onClick={() => navigate(`/loans/${calc.id}`)}
            >
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{calc.name}</span>
                <span className={styles.itemDesc}>{calc.description}</span>
              </div>
              <span className={styles.chevron}><IconChevronRight /></span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
