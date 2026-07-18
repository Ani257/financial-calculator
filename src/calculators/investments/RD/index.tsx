import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcRD,
  validateRD,
  type RDInputs,
} from '../../../engine/investments'

const EMPTY = {
  monthlyInstallment: '',
  annualRate:         '',
  tenureYears:        '',
}

export default function RDCalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof RDInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcRD> | null>(null)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: RDInputs = {
      monthlyInstallment: parseFloat(f.monthlyInstallment) || 0,
      annualRate:         parseFloat(f.annualRate)         || 0,
      tenureYears:        Math.round(parseFloat(f.tenureYears) || 0),
    }
    if (!validateRD(inputs).length) setResult(calcRD(inputs))
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
    const inputs: RDInputs = {
      monthlyInstallment: parseFloat(fields.monthlyInstallment) || 0,
      annualRate:         parseFloat(fields.annualRate)         || 0,
      tenureYears:        Math.round(parseFloat(fields.tenureYears) || 0),
    }
    const errs = validateRD(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof RDInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcRD(inputs))
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
      calculatorId="rd"
      calculatorName="Recurring Deposit"
      description="Maturity value of monthly RD with quarterly compounding."
      result={result ? resultRows.map((r) => ({ label: r.label, value: r.value })) : null}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Monthly Installment"
        value={fields.monthlyInstallment}
        onChange={(v) => setField('monthlyInstallment', v)}
        prefix="₹"
        placeholder="5,000"
        error={errors.monthlyInstallment}
      />
      <NumericInput
        label="Annual Interest Rate"
        value={fields.annualRate}
        onChange={(v) => setField('annualRate', v)}
        suffix="%"
        placeholder="6.5"
        error={errors.annualRate}
      />
      <NumericInput
        label="Tenure"
        value={fields.tenureYears}
        onChange={(v) => setField('tenureYears', v)}
        suffix="years"
        placeholder="3"
        hint="Whole years only"
        error={errors.tenureYears}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={resultRows} empty={result === null} />
    </CalculatorShell>
  )
}
