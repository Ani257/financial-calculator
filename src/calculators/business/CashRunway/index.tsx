import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcCashRunway,
  validateCashRunway,
  type CashRunwayInputs,
} from '../../../engine/business'
import styles from './CashRunway.module.css'

const EMPTY = { currentCash: '', monthlyBurnRate: '' }

export default function CashRunwayCalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof CashRunwayInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcCashRunway> | null>(null)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: CashRunwayInputs = {
      currentCash:     parseFloat(f.currentCash)     || 0,
      monthlyBurnRate: parseFloat(f.monthlyBurnRate) || 0,
    }
    if (!validateCashRunway(inputs).length) setResult(calcCashRunway(inputs))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleReset() {
    setFields({ ...EMPTY })
    setErrors({})
    setResult(null)
  }

  function handleCalculate() {
    const inputs: CashRunwayInputs = {
      currentCash:     parseFloat(fields.currentCash)     || 0,
      monthlyBurnRate: parseFloat(fields.monthlyBurnRate) || 0,
    }
    const errs = validateCashRunway(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof CashRunwayInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcCashRunway(inputs))
  }

  const mainRows: ResultRow[] = result
    ? [
        { label: 'Cash Runway',        value: result.runwayFmt,         highlight: true },
        { label: 'Runway End (approx)', value: result.runwayDateFmt },
        { label: 'Current Cash',        value: result.currentCashFmt },
        { label: 'Monthly Burn Rate',   value: result.monthlyBurnRateFmt },
      ]
    : []

  const resultRows: Array<{ label: string; value: string }> | null = result
    ? mainRows.map((r) => ({ label: r.label, value: r.value }))
    : null

  return (
    <CalculatorShell
      calculatorId="cash-runway"
      calculatorName="Cash Runway"
      description="How long your current cash will last at your net burn rate."
      result={resultRows}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Current Cash Balance"
        value={fields.currentCash}
        onChange={(v) => setField('currentCash', v)}
        prefix="₹"
        placeholder="5,00,000"
        hint="Total cash available today"
        error={errors.currentCash}
      />
      <NumericInput
        label="Monthly Net Burn Rate"
        value={fields.monthlyBurnRate}
        onChange={(v) => setField('monthlyBurnRate', v)}
        prefix="₹"
        placeholder="80,000"
        hint="Net cash consumed per month (expenses minus revenue)"
        error={errors.monthlyBurnRate}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={mainRows} empty={result === null} />

      {result && result.projections.length > 0 && (
        <div className={styles.projections}>
          <p className={styles.projTitle}>Cash Projections</p>
          {result.projections.map((p) => (
            <div
              key={p.label}
              className={[styles.projRow, p.exhausted ? styles.exhausted : ''].filter(Boolean).join(' ')}
            >
              <span className={styles.projLabel}>{p.label}</span>
              <span className={styles.projValue}>{p.value}</span>
            </div>
          ))}
        </div>
      )}
    </CalculatorShell>
  )
}
