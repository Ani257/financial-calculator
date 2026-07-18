import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcNormalSIP,
  validateNormalSIP,
  type NormalSIPInputs,
} from '../../../engine/investments'

const EMPTY = {
  monthlyInvestment: '',
  annualReturnPct:   '',
  tenureYears:       '',
}

export default function NormalSIPCalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof NormalSIPInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcNormalSIP> | null>(null)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: NormalSIPInputs = {
      monthlyInvestment: parseFloat(f.monthlyInvestment) || 0,
      annualReturnPct:   parseFloat(f.annualReturnPct)   || 0,
      tenureYears:       Math.round(parseFloat(f.tenureYears) || 0),
    }
    if (!validateNormalSIP(inputs).length) setResult(calcNormalSIP(inputs))
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
    const inputs: NormalSIPInputs = {
      monthlyInvestment: parseFloat(fields.monthlyInvestment) || 0,
      annualReturnPct:   parseFloat(fields.annualReturnPct)   || 0,
      tenureYears:       Math.round(parseFloat(fields.tenureYears) || 0),
    }
    const errs = validateNormalSIP(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof NormalSIPInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcNormalSIP(inputs))
  }

  const resultRows: ResultRow[] = result
    ? [
        { label: 'Estimated Wealth',  value: result.estimatedWealthFmt,  highlight: true },
        { label: 'Total Invested',    value: result.totalInvestedFmt },
        { label: 'Wealth Gained',     value: result.wealthGainedFmt },
        { label: 'Absolute Return',   value: result.absoluteReturnFmt },
      ]
    : []

  return (
    <CalculatorShell
      calculatorId="normal-sip"
      calculatorName="SIP Calculator"
      description="Estimate corpus from a fixed monthly SIP over time."
      result={result ? resultRows.map((r) => ({ label: r.label, value: r.value })) : null}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Monthly Investment"
        value={fields.monthlyInvestment}
        onChange={(v) => setField('monthlyInvestment', v)}
        prefix="₹"
        placeholder="5,000"
        error={errors.monthlyInvestment}
      />
      <NumericInput
        label="Expected Annual Return"
        value={fields.annualReturnPct}
        onChange={(v) => setField('annualReturnPct', v)}
        suffix="%"
        placeholder="12"
        error={errors.annualReturnPct}
      />
      <NumericInput
        label="Investment Tenure"
        value={fields.tenureYears}
        onChange={(v) => setField('tenureYears', v)}
        suffix="years"
        placeholder="10"
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
