import { useState } from 'react'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcBreakEven,
  validateBreakEven,
  type BreakEvenInputs,
} from '../../../engine/business'

const EMPTY = {
  fixedCosts:           '',
  variableCostPerUnit:  '',
  sellingPricePerUnit:  '',
}

export default function BreakEvenCalculator() {
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof BreakEvenInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcBreakEven> | null>(null)

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
    const inputs: BreakEvenInputs = {
      fixedCosts:          parseFloat(fields.fixedCosts)          || 0,
      variableCostPerUnit: parseFloat(fields.variableCostPerUnit) || 0,
      sellingPricePerUnit: parseFloat(fields.sellingPricePerUnit) || 0,
    }

    const errs = validateBreakEven(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof BreakEvenInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }

    setErrors({})
    setResult(calcBreakEven(inputs))
  }

  // Result rows for CalculatorShell (copy / export / favorites)
  const resultRows: Array<{ label: string; value: string }> | null = result
    ? displayRows(result).map((r) => ({ label: r.label, value: r.value }))
    : null

  return (
    <CalculatorShell
      calculatorId="break-even"
      calculatorName="Break-Even"
      description="The unit volume and revenue at which total costs equal total income."
      result={resultRows}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Monthly Fixed Costs"
        value={fields.fixedCosts}
        onChange={(v) => setField('fixedCosts', v)}
        prefix="₹"
        placeholder="50,000"
        hint="Rent, salaries, insurance — costs that don't change with output"
        error={errors.fixedCosts}
      />
      <NumericInput
        label="Variable Cost per Unit"
        value={fields.variableCostPerUnit}
        onChange={(v) => setField('variableCostPerUnit', v)}
        prefix="₹"
        placeholder="12.50"
        hint="Materials, labour, packaging — cost per single unit produced"
        error={errors.variableCostPerUnit}
      />
      <NumericInput
        label="Selling Price per Unit"
        value={fields.sellingPricePerUnit}
        onChange={(v) => setField('sellingPricePerUnit', v)}
        prefix="₹"
        placeholder="25.00"
        hint="Revenue received per unit sold"
        error={errors.sellingPricePerUnit}
      />

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={result ? displayRows(result) : []} empty={result === null} />
    </CalculatorShell>
  )
}

function displayRows(r: ReturnType<typeof calcBreakEven>): ResultRow[] {
  return [
    { label: 'Break-Even (Units)',       value: r.breakEvenUnitsFmt,       highlight: true },
    { label: 'Break-Even (Revenue)',      value: r.breakEvenRevenueFmt },
    { label: 'Contribution Margin / Unit', value: r.contributionMarginFmt },
    { label: 'Contribution Margin %',     value: r.contributionMarginPctFmt },
    { label: 'Fixed Costs',               value: r.fixedCostsFmt },
  ]
}
