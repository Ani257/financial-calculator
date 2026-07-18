import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcCAGR,
  validateCAGR,
  type CAGRInputs,
} from '../../../engine/investments'

const EMPTY = {
  initialValue:  '',
  finalValue:    '',
  durationYears: '',
}

export default function CAGRCalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof CAGRInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcCAGR> | null>(null)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: CAGRInputs = {
      initialValue:  parseFloat(f.initialValue)  || 0,
      finalValue:    parseFloat(f.finalValue)    || 0,
      durationYears: parseFloat(f.durationYears) || 0,
    }
    if (!validateCAGR(inputs).length) setResult(calcCAGR(inputs))
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
    const inputs: CAGRInputs = {
      initialValue:  parseFloat(fields.initialValue)  || 0,
      finalValue:    parseFloat(fields.finalValue)    || 0,
      durationYears: parseFloat(fields.durationYears) || 0,
    }
    const errs = validateCAGR(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof CAGRInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcCAGR(inputs))
  }

  const resultRows: ResultRow[] = result
    ? [
        { label: 'CAGR',              value: result.cagrPctFmt,           highlight: true },
        { label: 'Absolute Growth',   value: result.absoluteGrowthPctFmt },
        { label: 'Total Profit',      value: result.totalProfitFmt },
      ]
    : []

  return (
    <CalculatorShell
      calculatorId="cagr"
      calculatorName="CAGR Calculator"
      description="Compound Annual Growth Rate — the true annual return of any investment."
      result={result ? resultRows.map((r) => ({ label: r.label, value: r.value })) : null}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Initial Value"
        value={fields.initialValue}
        onChange={(v) => setField('initialValue', v)}
        prefix="₹"
        placeholder="1,00,000"
        error={errors.initialValue}
      />
      <NumericInput
        label="Final Value"
        value={fields.finalValue}
        onChange={(v) => setField('finalValue', v)}
        prefix="₹"
        placeholder="2,50,000"
        error={errors.finalValue}
      />
      <NumericInput
        label="Duration"
        value={fields.durationYears}
        onChange={(v) => setField('durationYears', v)}
        suffix="years"
        placeholder="5"
        hint="Decimals allowed, e.g. 2.5"
        error={errors.durationYears}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={resultRows} empty={result === null} />
    </CalculatorShell>
  )
}
