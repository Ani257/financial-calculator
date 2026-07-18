import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './CategoryCard.module.css'

interface Calculator {
  id: string
  name: string
}

interface CategoryCardProps {
  title: string
  description: string
  route: string
  calculators: Calculator[]
  icon: ReactNode
  accent?: string
}

export default function CategoryCard({
  title,
  description,
  route,
  calculators,
  icon,
}: CategoryCardProps) {
  const navigate = useNavigate()

  return (
    <button
      className={styles.card}
      onClick={() => navigate(route)}
      aria-label={`Go to ${title} calculators`}
    >
      <div className={styles.top}>
        <span className={styles.icon}>{icon}</span>
        <div className={styles.info}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
      <ul className={styles.pills}>
        {calculators.map((c) => (
          <li key={c.id} className={styles.pill}>
            {c.name}
          </li>
        ))}
      </ul>
    </button>
  )
}
