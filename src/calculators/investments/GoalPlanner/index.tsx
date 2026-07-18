import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcGoalPlanner,
  validateGoalPlanner,
  type GoalPlannerInputs,
} from '../../../engine/investments'

const EMPTY = {
  targetWealth:     '',
  timeHorizonYears: '',
  annualReturnPct:  '',
  currentSavings:   '',
}

export default function GoalPlannerCalculator() {
  const location = useLocation()
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof GoalPlannerInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcGoalPlanner> | null>(null)

  // Hydrate from favorites / recents navigation
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return
    const f = { ...EMPTY, ...saved }
    setFields(f)
    const inputs: GoalPlannerInputs = {
      targetWealth:     parseFloat(f.targetWealth)     || 0,
      timeHorizonYears: Math.round(parseFloat(f.timeHorizonYears) || 0),
      annualReturnPct:  parseFloat(f.annualReturnPct)  || 0,
      currentSavings:   parseFloat(f.currentSavings)   || 0,
    }
    if (!validateGoalPlanner(inputs).length) setResult(calcGoalPlanner(inputs))
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
    const inputs: GoalPlannerInputs = {
      targetWealth:     parseFloat(fields.targetWealth)     || 0,
      timeHorizonYears: Math.round(parseFloat(fields.timeHorizonYears) || 0),
      annualReturnPct:  parseFloat(fields.annualReturnPct)  || 0,
      currentSavings:   parseFloat(fields.currentSavings)   || 0,
    }
    const errs = validateGoalPlanner(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof GoalPlannerInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcGoalPlanner(inputs))
  }

  const rows: ResultRow[] = result
    ? [
        { label: 'Required Monthly SIP',   value: result.requiredMonthlySIPFmt,   highlight: true },
        { label: 'Target Wealth',          value: result.targetWealthFmt },
        { label: 'Total SIP Contribution', value: result.totalSIPContributionFmt },
        { label: 'Wealth Gained (SIP)',    value: result.wealthGainedFmt },
        { label: 'Current Savings → FV',   value: result.fvCurrentSavingsFmt },
        { label: 'Time Horizon',           value: result.timeHorizonLabel },
      ]
    : []

  const resultRows: Array<{ label: string; value: string }> | null = result
    ? rows.map((r) => ({ label: r.label, value: r.value }))
    : null

  return (
    <CalculatorShell
      calculatorId="goal-planner"
      calculatorName="Goal Planner"
      description="Find the monthly SIP required to reach your target wealth."
      result={resultRows}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Target Wealth"
        value={fields.targetWealth}
        onChange={(v) => setField('targetWealth', v)}
        prefix="₹"
        placeholder="10,00,000"
        hint="The total amount you want to accumulate"
        error={errors.targetWealth}
      />
      <NumericInput
        label="Time Horizon"
        value={fields.timeHorizonYears}
        onChange={(v) => setField('timeHorizonYears', v)}
        suffix="years"
        placeholder="20"
        hint="Years until you need the money"
        error={errors.timeHorizonYears}
      />
      <NumericInput
        label="Expected Annual Return"
        value={fields.annualReturnPct}
        onChange={(v) => setField('annualReturnPct', v)}
        suffix="%"
        placeholder="12"
        hint="Expected annualised return from your investment"
        error={errors.annualReturnPct}
      />
      <NumericInput
        label="Current Savings"
        value={fields.currentSavings}
        onChange={(v) => setField('currentSavings', v)}
        prefix="₹"
        placeholder="0"
        hint="Amount already invested — leave 0 if starting fresh"
        error={errors.currentSavings}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={rows} empty={result === null} />
    </CalculatorShell>
  )
}
