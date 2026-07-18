import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        loading ? styles.loading : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={loading ? styles.hidden : ''}>{children}</span>
    </button>
  )
}
