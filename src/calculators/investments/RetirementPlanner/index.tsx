import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcRetirementPlanner,
  validateRetirementPlanner,
  type RetirementPlannerInputs,
} from '../../../engine/investments'

const EMPTY = {
  currentAge:              '',
  retirementAge:           '',
  lifeExpectancy:          '',
  currentMonthlyExpenses:  '',
  inflationPct:            '',
  preRetirementReturnPct:  '',
  postRetirementReturnPct: '',
  currentSavings:          '',
}

export default function RetirementPlannerCalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof RetirementPlannerInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcRetirementPlanner> | null>(null)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: RetirementPlannerInputs = {
      currentAge:              Math.round(parseFloat(f.currentAge)              || 0),
      retirementAge:           Math.round(parseFloat(f.retirementAge)           || 0),
      lifeExpectancy:          Math.round(parseFloat(f.lifeExpectancy)          || 0),
      currentMonthlyExpenses:  parseFloat(f.currentMonthlyExpenses)             || 0,
      inflationPct:            parseFloat(f.inflationPct)                       || 0,
      preRetirementReturnPct:  parseFloat(f.preRetirementReturnPct)             || 0,
      postRetirementReturnPct: parseFloat(f.postRetirementReturnPct)            || 0,
      currentSavings:          parseFloat(f.currentSavings)                     || 0,
    }
    if (!validateRetirementPlanner(inputs).length) setResult(calcRetirementPlanner(inputs))
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
    const inputs: RetirementPlannerInputs = {
      currentAge:              Math.round(parseFloat(fields.currentAge)              || 0),
      retirementAge:           Math.round(parseFloat(fields.retirementAge)           || 0),
      lifeExpectancy:          Math.round(parseFloat(fields.lifeExpectancy)          || 0),
      currentMonthlyExpenses:  parseFloat(fields.currentMonthlyExpenses)             || 0,
      inflationPct:            parseFloat(fields.inflationPct)                       || 0,
      preRetirementReturnPct:  parseFloat(fields.preRetirementReturnPct)             || 0,
      postRetirementReturnPct: parseFloat(fields.postRetirementReturnPct)            || 0,
      currentSavings:          parseFloat(fields.currentSavings)                     || 0,
    }
    const errs = validateRetirementPlanner(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof RetirementPlannerInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcRetirementPlanner(inputs))
  }

  const resultRows: ResultRow[] = result
    ? [
        { label: 'Required Monthly SIP',          value: result.requiredMonthlySIPFmt,          highlight: true },
        { label: 'Monthly Expenses at Retirement', value: result.monthlyExpensesAtRetirementFmt },
        { label: 'Total Corpus Required',          value: result.totalCorpusRequiredFmt },
        { label: 'FV of Current Savings',          value: result.fvCurrentSavingsFmt },
        { label: 'Remaining Shortfall',            value: result.shortfallFmt },
      ]
    : []

  return (
    <CalculatorShell
      calculatorId="retirement-planner"
      calculatorName="Retirement Planner"
      description="How much you must save monthly to retire comfortably."
      result={result ? resultRows.map((r) => ({ label: r.label, value: r.value })) : null}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Current Age"
        value={fields.currentAge}
        onChange={(v) => setField('currentAge', v)}
        suffix="yrs"
        placeholder="30"
        error={errors.currentAge}
      />
      <NumericInput
        label="Retirement Age"
        value={fields.retirementAge}
        onChange={(v) => setField('retirementAge', v)}
        suffix="yrs"
        placeholder="60"
        error={errors.retirementAge}
      />
      <NumericInput
        label="Life Expectancy"
        value={fields.lifeExpectancy}
        onChange={(v) => setField('lifeExpectancy', v)}
        suffix="yrs"
        placeholder="85"
        hint="Planning horizon for retirement corpus"
        error={errors.lifeExpectancy}
      />
      <NumericInput
        label="Current Monthly Expenses"
        value={fields.currentMonthlyExpenses}
        onChange={(v) => setField('currentMonthlyExpenses', v)}
        prefix="₹"
        placeholder="50,000"
        error={errors.currentMonthlyExpenses}
      />
      <NumericInput
        label="Expected Annual Inflation"
        value={fields.inflationPct}
        onChange={(v) => setField('inflationPct', v)}
        suffix="%"
        placeholder="6"
        error={errors.inflationPct}
      />
      <NumericInput
        label="Pre-Retirement Return"
        value={fields.preRetirementReturnPct}
        onChange={(v) => setField('preRetirementReturnPct', v)}
        suffix="%"
        placeholder="12"
        hint="Expected return while accumulating"
        error={errors.preRetirementReturnPct}
      />
      <NumericInput
        label="Post-Retirement Return"
        value={fields.postRetirementReturnPct}
        onChange={(v) => setField('postRetirementReturnPct', v)}
        suffix="%"
        placeholder="7"
        hint="Expected return after retirement"
        error={errors.postRetirementReturnPct}
      />
      <NumericInput
        label="Current Savings"
        value={fields.currentSavings}
        onChange={(v) => setField('currentSavings', v)}
        prefix="₹"
        placeholder="0"
        hint="Amount already invested (can be 0)"
        error={errors.currentSavings}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={resultRows} empty={result === null} />
    </CalculatorShell>
  )
}
