import styles from './ResultCard.module.css'

export interface ResultRow {
  label: string
  value: string
  highlight?: boolean
  subvalue?: string
}

interface ResultCardProps {
  rows: ResultRow[]
  empty?: boolean
  emptyText?: string
}

export default function ResultCard({
  rows,
  empty = false,
  emptyText = 'Fill in the fields above and tap Calculate',
}: ResultCardProps) {
  if (empty || rows.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      {rows.map((row, i) => (
        <div
          key={i}
          className={[styles.row, row.highlight ? styles.highlighted : '']
            .filter(Boolean)
            .join(' ')}
        >
          <span className={styles.label}>{row.label}</span>
          <span className={styles.value}>
            {row.value}
            {row.subvalue && (
              <span className={styles.subvalue}>{row.subvalue}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
