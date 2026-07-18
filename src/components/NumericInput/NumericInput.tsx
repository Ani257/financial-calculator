import { type ChangeEvent } from 'react'
import styles from './NumericInput.module.css'

interface NumericInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  prefix?: string
  suffix?: string
  hint?: string
  error?: string
  min?: number
  max?: number
  step?: number
  required?: boolean
  disabled?: boolean
}

export default function NumericInput({
  label,
  value,
  onChange,
  placeholder = '0',
  prefix,
  suffix,
  hint,
  error,
  disabled = false,
}: NumericInputProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Allow empty, digits, one decimal point, and leading minus
    if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
      onChange(raw)
    }
  }

  return (
    <div className={styles.group}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      <div
        className={[
          styles.inputWrapper,
          error ? styles.hasError : '',
          disabled ? styles.disabled : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {prefix && <span className={styles.affix}>{prefix}</span>}

        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.input}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {suffix && <span className={styles.affix}>{suffix}</span>}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
