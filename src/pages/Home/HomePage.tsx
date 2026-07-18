import CategoryCard from '../../components/CategoryCard/CategoryCard'
import styles from './HomePage.module.css'

function IconBriefcase() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function IconTrendingUp() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function IconPercent() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
}

const categories = [
  {
    title: 'Business',
    description: 'Runway, burn rate, and break-even analysis for operators.',
    route: '/business',
    icon: <IconBriefcase />,
    calculators: [
      { id: 'cash-runway',  name: 'Cash Runway' },
      { id: 'burn-rate',    name: 'Burn Rate' },
      { id: 'break-even',   name: 'Break-Even' },
    ],
  },
  {
    title: 'Loans',
    description: 'EMI, amortization, and debt consolidation planning.',
    route: '/loans',
    icon: <IconPercent />,
    calculators: [
      { id: 'emi',                name: 'EMI' },
      { id: 'amortization',       name: 'Amortization' },
      { id: 'debt-consolidation', name: 'Debt Consolidation' },
    ],
  },
  {
    title: 'Investments',
    description: 'Step-up SIP projections and goal-based planning.',
    route: '/investments',
    icon: <IconTrendingUp />,
    calculators: [
      { id: 'step-up-sip',   name: 'Step-Up SIP' },
      { id: 'goal-planner',  name: 'Goal Planner' },
    ],
  },
]

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.wordmark}>
          <span className={styles.fin}>Fin</span>
          <span className={styles.calc}>Calc</span>
        </div>
        <p className={styles.tagline}>Professional financial toolkit</p>
      </header>

      <section>
        <p className={styles.sectionLabel}>Calculators</p>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <CategoryCard key={cat.route} {...cat} />
          ))}
        </div>
      </section>
    </div>
  )
}
