import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcFD,
  validateFD,
  type FDInputs,
} from '../../../engine/investments'

const EMPTY = {
  principal:   '',
  annualRate:  '',
  tenureYears: '',
}

export default function FDCalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof FDInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcFD> | null>(null)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: FDInputs = {
      principal:   parseFloat(f.principal)   || 0,
      annualRate:  parseFloat(f.annualRate)  || 0,
      tenureYears: parseFloat(f.tenureYears) || 0,
    }
    if (!validateFD(inputs).length) setResult(calcFD(inputs))
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
    const inputs: FDInputs = {
      principal:   parseFloat(fields.principal)   || 0,
      annualRate:  parseFloat(fields.annualRate)  || 0,
      tenureYears: parseFloat(fields.tenureYears) || 0,
    }
    const errs = validateFD(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof FDInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcFD(inputs))
  }

  const resultRows: ResultRow[] = result
    ? [
        { label: 'Maturity Amount',     value: result.maturityAmountFmt,  highlight: true },
        { label: 'Total Investment',    value: result.totalInvestmentFmt },
        { label: 'Total Interest',      value: result.totalInterestFmt },
      ]
    : []

  return (
    <CalculatorShell
      calculatorId="fd"
      calculatorName="Fixed Deposit"
      description="Maturity amount with quarterly compounding — the Indian bank standard."
      result={result ? resultRows.map((r) => ({ label: r.label, value: r.value })) : null}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Principal Amount"
        value={fields.principal}
        onChange={(v) => setField('principal', v)}
        prefix="₹"
        placeholder="1,00,000"
        error={errors.principal}
      />
      <NumericInput
        label="Annual Interest Rate"
        value={fields.annualRate}
        onChange={(v) => setField('annualRate', v)}
        suffix="%"
        placeholder="7.0"
        error={errors.annualRate}
      />
      <NumericInput
        label="Tenure"
        value={fields.tenureYears}
        onChange={(v) => setField('tenureYears', v)}
        suffix="years"
        placeholder="3"
        hint="Decimals allowed, e.g. 1.5 for 18 months"
        error={errors.tenureYears}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={resultRows} empty={result === null} />
    </CalculatorShell>
  )
}
