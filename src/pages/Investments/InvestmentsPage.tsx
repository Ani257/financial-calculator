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
    id: 'normal-sip',
    name: 'SIP Calculator',
    description: 'Estimate corpus from a fixed monthly SIP over time.',
  },
  {
    id: 'step-up-sip',
    name: 'Step-Up SIP',
    description: 'How your wealth grows when you increase your SIP every year.',
  },
  {
    id: 'goal-planner',
    name: 'Goal Planner',
    description: 'Find the monthly SIP required to reach your target wealth.',
  },
  {
    id: 'fd',
    name: 'Fixed Deposit',
    description: 'FD maturity with quarterly compounding — the Indian bank standard.',
  },
  {
    id: 'rd',
    name: 'Recurring Deposit',
    description: 'RD maturity value with quarterly compounding on monthly deposits.',
  },
  {
    id: 'cagr',
    name: 'CAGR Calculator',
    description: 'Compound Annual Growth Rate — the true annual return of any investment.',
  },
  {
    id: 'swp',
    name: 'SWP Calculator',
    description: 'Systematic Withdrawal Plan with inflation-adjusted monthly withdrawals.',
  },
  {
    id: 'retirement-planner',
    name: 'Retirement Planner',
    description: 'Monthly SIP needed to retire comfortably at your target age.',
  },
]

export default function InvestmentsPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className={styles.title}>Investments</h1>
      </header>

      <ul className={styles.list}>
        {calculators.map((calc) => (
          <li key={calc.id}>
            <button
              className={styles.item}
              onClick={() => navigate(`/investments/${calc.id}`)}
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
