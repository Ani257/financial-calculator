import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import { calcAmortization, validateEMI, type EMIInputs } from '../../../engine/loans'
import styles from './Amortization.module.css'

const EMPTY = { principal: '', annualRate: '', tenureMonths: '' }

export default function AmortizationCalculator() {
  const location = useLocation()
  const [fields, setFields]       = useState({ ...EMPTY })
  const [errors, setErrors]       = useState<Partial<Record<keyof EMIInputs, string>>>({})
  const [result, setResult]       = useState<ReturnType<typeof calcAmortization> | null>(null)
  const [showAll, setShowAll]     = useState(false)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: EMIInputs = {
      principal:    parseFloat(f.principal)    || 0,
      annualRate:   parseFloat(f.annualRate)   || 0,
      tenureMonths: Math.round(parseFloat(f.tenureMonths) || 0),
    }
    if (!validateEMI(inputs).length) setResult(calcAmortization(inputs))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleReset() {
    setFields({ ...EMPTY })
    setErrors({})
    setResult(null)
    setShowAll(false)
  }

  function handleCalculate() {
    const inputs: EMIInputs = {
      principal:    parseFloat(fields.principal)    || 0,
      annualRate:   parseFloat(fields.annualRate)   || 0,
      tenureMonths: Math.round(parseFloat(fields.tenureMonths) || 0),
    }
    const errs = validateEMI(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof EMIInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setShowAll(false)
    setResult(calcAmortization(inputs))
  }

  const summaryRows: ResultRow[] = result
    ? [
        { label: 'Monthly EMI',    value: result.monthlyEMIFmt,    highlight: true },
        { label: 'Total Payment',  value: result.totalPaymentFmt },
        { label: 'Total Interest', value: result.totalInterestFmt },
      ]
    : []

  const resultRows: Array<{ label: string; value: string }> | null = result
    ? summaryRows.map((r) => ({ label: r.label, value: r.value }))
    : null

  const PREVIEW_ROWS = 24
  const schedule     = result?.schedule ?? []
  const visible      = showAll ? schedule : schedule.slice(0, PREVIEW_ROWS)

  return (
    <CalculatorShell
      calculatorId="amortization"
      calculatorName="Amortization Schedule"
      description="Full month-by-month breakdown of principal and interest."
      result={resultRows}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Loan Amount (Principal)"
        value={fields.principal}
        onChange={(v) => setField('principal', v)}
        prefix="₹"
        placeholder="200,000"
        error={errors.principal}
      />
      <NumericInput
        label="Annual Interest Rate"
        value={fields.annualRate}
        onChange={(v) => setField('annualRate', v)}
        suffix="%"
        placeholder="8.5"
        error={errors.annualRate}
      />
      <NumericInput
        label="Loan Tenure"
        value={fields.tenureMonths}
        onChange={(v) => setField('tenureMonths', v)}
        suffix="months"
        placeholder="60"
        hint="Repayment period in months"
        error={errors.tenureMonths}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Generate Schedule
      </Button>

      {/* Summary card */}
      <ResultCard rows={summaryRows} empty={result === null} />

      {/* Amortization table */}
      {result && schedule.length > 0 && (
        <div className={styles.tableWrap}>
          <div className={styles.tableHeader}>
            <span>Amortization Schedule</span>
            <span className={styles.rowCount}>{schedule.length} months</span>
          </div>

          {/* Column headers */}
          <div className={styles.colHeaders}>
            <span>Mo.</span>
            <span>Payment</span>
            <span>Principal</span>
            <span>Interest</span>
            <span>Balance</span>
          </div>

          {/* Scrollable rows — rendered fully for print/export; capped visually */}
          <div className={styles.rows}>
            {visible.map((row) => (
              <div
                key={row.month}
                className={[styles.row, row.month % 12 === 0 ? styles.yearEnd : ''].filter(Boolean).join(' ')}
              >
                <span className={styles.month}>{row.month}</span>
                <span>{row.paymentFmt}</span>
                <span className={styles.principal}>{row.principalPaidFmt}</span>
                <span className={styles.interest}>{row.interestPaidFmt}</span>
                <span>{row.remainingBalanceFmt}</span>
              </div>
            ))}
          </div>

          {!showAll && schedule.length > PREVIEW_ROWS && (
            <button className={styles.showAll} onClick={() => setShowAll(true)}>
              Show all {schedule.length} months ↓
            </button>
          )}
        </div>
      )}
    </CalculatorShell>
  )
}
