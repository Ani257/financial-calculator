import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcSWP,
  validateSWP,
  type SWPInputs,
} from '../../../engine/investments'
import styles from './SWP.module.css'

const EMPTY = {
  corpus:             '',
  monthlyWithdrawal:  '',
  annualReturnPct:    '',
  annualInflationPct: '',
  tenureYears:        '',
}

export default function SWPCalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof SWPInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcSWP> | null>(null)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: SWPInputs = {
      corpus:             parseFloat(f.corpus)             || 0,
      monthlyWithdrawal:  parseFloat(f.monthlyWithdrawal)  || 0,
      annualReturnPct:    parseFloat(f.annualReturnPct)    || 0,
      annualInflationPct: parseFloat(f.annualInflationPct) || 0,
      tenureYears:        Math.round(parseFloat(f.tenureYears) || 0),
    }
    if (!validateSWP(inputs).length) setResult(calcSWP(inputs))
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
    const inputs: SWPInputs = {
      corpus:             parseFloat(fields.corpus)             || 0,
      monthlyWithdrawal:  parseFloat(fields.monthlyWithdrawal)  || 0,
      annualReturnPct:    parseFloat(fields.annualReturnPct)    || 0,
      annualInflationPct: parseFloat(fields.annualInflationPct) || 0,
      tenureYears:        Math.round(parseFloat(fields.tenureYears) || 0),
    }
    const errs = validateSWP(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof SWPInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcSWP(inputs))
  }

  const resultRows: ResultRow[] = result
    ? [
        {
          label:     result.depleted ? 'Final Corpus (Depleted)' : 'Final Corpus Value',
          value:     result.finalCorpusFmt,
          highlight: true,
        },
        { label: 'Total Amount Withdrawn', value: result.totalWithdrawnFmt },
        ...(result.depletionLabel
          ? [{ label: 'Corpus Depleted In', value: result.depletionLabel }]
          : []),
      ]
    : []

  return (
    <CalculatorShell
      calculatorId="swp"
      calculatorName="SWP Calculator"
      description="Systematic Withdrawal Plan with inflation-adjusted withdrawals."
      result={result ? resultRows.map((r) => ({ label: r.label, value: r.value })) : null}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Total Investment (Corpus)"
        value={fields.corpus}
        onChange={(v) => setField('corpus', v)}
        prefix="₹"
        placeholder="50,00,000"
        error={errors.corpus}
      />
      <NumericInput
        label="Initial Monthly Withdrawal"
        value={fields.monthlyWithdrawal}
        onChange={(v) => setField('monthlyWithdrawal', v)}
        prefix="₹"
        placeholder="30,000"
        error={errors.monthlyWithdrawal}
      />
      <NumericInput
        label="Expected Annual Return"
        value={fields.annualReturnPct}
        onChange={(v) => setField('annualReturnPct', v)}
        suffix="%"
        placeholder="10"
        hint="Return the corpus earns while invested"
        error={errors.annualReturnPct}
      />
      <NumericInput
        label="Annual Inflation"
        value={fields.annualInflationPct}
        onChange={(v) => setField('annualInflationPct', v)}
        suffix="%"
        placeholder="6"
        hint="Withdrawal steps up by this % every year"
        error={errors.annualInflationPct}
      />
      <NumericInput
        label="Tenure"
        value={fields.tenureYears}
        onChange={(v) => setField('tenureYears', v)}
        suffix="years"
        placeholder="20"
        hint="Whole years only"
        error={errors.tenureYears}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      {result?.depleted && (
        <div className={styles.depletionBanner}>
          ⚠ Corpus depletes before tenure ends — {result.depletionLabel}
        </div>
      )}

      <ResultCard rows={resultRows} empty={result === null} />
    </CalculatorShell>
  )
}
