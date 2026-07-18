import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import { calcEMI, validateEMI, type EMIInputs } from '../../../engine/loans'
import styles from './EMI.module.css'

const EMPTY = { principal: '', annualRate: '', tenureMonths: '' }

export default function EMICalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof EMIInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcEMI> | null>(null)

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
    if (!validateEMI(inputs).length) setResult(calcEMI(inputs))
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
    const inputs: EMIInputs = {
      principal:    parseFloat(fields.principal)  || 0,
      annualRate:   parseFloat(fields.annualRate) || 0,
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
    setResult(calcEMI(inputs))
  }

  const rows: ResultRow[] = result
    ? [
        { label: 'Monthly EMI',    value: result.monthlyEMIFmt,    highlight: true },
        { label: 'Total Payment',  value: result.totalPaymentFmt },
        { label: 'Total Interest', value: result.totalInterestFmt },
        { label: 'Principal',      value: result.principalFmt },
        { label: 'Principal %',    value: result.principalPctFmt },
        { label: 'Interest %',     value: result.interestPctFmt },
      ]
    : []

  const resultRows: Array<{ label: string; value: string }> | null = result
    ? rows.map((r) => ({ label: r.label, value: r.value }))
    : null

  return (
    <CalculatorShell
      calculatorId="emi"
      calculatorName="EMI Calculator"
      description="Monthly instalment amount for any loan."
      result={resultRows}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Loan Amount (Principal)"
        value={fields.principal}
        onChange={(v) => setField('principal', v)}
        prefix="₹"
        placeholder="2,00,000"
        hint="Total amount borrowed"
        error={errors.principal}
      />
      <NumericInput
        label="Annual Interest Rate"
        value={fields.annualRate}
        onChange={(v) => setField('annualRate', v)}
        suffix="%"
        placeholder="8.5"
        hint="Annual rate (e.g. 8.5 for 8.5%)"
        error={errors.annualRate}
      />
      <NumericInput
        label="Loan Tenure"
        value={fields.tenureMonths}
        onChange={(v) => setField('tenureMonths', v)}
        suffix="months"
        placeholder="60"
        hint="Repayment period in months (e.g. 60 = 5 years)"
        error={errors.tenureMonths}
      />

      {/* Quick tenure shortcuts */}
      <div className={styles.shortcuts}>
        {[12, 24, 36, 60, 84, 120, 180, 240].map((m) => (
          <button
            key={m}
            className={[styles.chip, fields.tenureMonths === String(m) ? styles.chipActive : ''].join(' ')}
            onClick={() => { setField('tenureMonths', String(m)); setErrors((p) => ({ ...p, tenureMonths: undefined })) }}
          >
            {m >= 12 ? `${m / 12}yr` : `${m}mo`}
          </button>
        ))}
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={rows} empty={result === null} />
    </CalculatorShell>
  )
}
