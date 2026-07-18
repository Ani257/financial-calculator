import { useState } from 'react'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcStepUpSIP,
  validateStepUpSIP,
  type StepUpSIPInputs,
} from '../../../engine/investments'
import styles from './StepUpSIP.module.css'

const EMPTY = {
  monthlyInvestment: '',
  annualStepUpPct:   '',
  annualReturnPct:   '',
  tenureYears:       '',
}

export default function StepUpSIPCalculator() {
  const [fields, setFields] = useState({ ...EMPTY })
  const [errors, setErrors] = useState<Partial<Record<keyof StepUpSIPInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcStepUpSIP> | null>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleReset() {
    setFields({ ...EMPTY })
    setErrors({})
    setResult(null)
    setShowBreakdown(false)
  }

  function handleCalculate() {
    const inputs: StepUpSIPInputs = {
      monthlyInvestment: parseFloat(fields.monthlyInvestment) || 0,
      annualStepUpPct:   parseFloat(fields.annualStepUpPct)   || 0,
      annualReturnPct:   parseFloat(fields.annualReturnPct)   || 0,
      tenureYears:       Math.round(parseFloat(fields.tenureYears) || 0),
    }
    const errs = validateStepUpSIP(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof StepUpSIPInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setShowBreakdown(false)
    setResult(calcStepUpSIP(inputs))
  }

  const rows: ResultRow[] = result
    ? [
        { label: 'Estimated Wealth',        value: result.estimatedWealthFmt,    highlight: true },
        { label: 'Total Invested',          value: result.totalInvestedFmt },
        { label: 'Wealth Gained',           value: result.wealthGainedFmt },
        { label: 'Absolute Return',         value: result.absoluteReturnFmt },
        { label: 'Starting Monthly SIP',    value: result.monthlyInvestmentFmt },
        { label: 'Final Year Monthly SIP',  value: result.finalMonthlyContribFmt },
      ]
    : []

  const resultRows: Array<{ label: string; value: string }> | null = result
    ? rows.map((r) => ({ label: r.label, value: r.value }))
    : null

  return (
    <CalculatorShell
      calculatorId="step-up-sip"
      calculatorName="Step-Up SIP"
      description="How your wealth grows when you increase your SIP every year."
      result={resultRows}
      inputs={fields}
      onReset={handleReset}
    >
      <NumericInput
        label="Monthly Investment"
        value={fields.monthlyInvestment}
        onChange={(v) => setField('monthlyInvestment', v)}
        prefix="$"
        placeholder="500"
        hint="Amount you invest each month in year 1"
        error={errors.monthlyInvestment}
      />
      <NumericInput
        label="Annual Step-Up"
        value={fields.annualStepUpPct}
        onChange={(v) => setField('annualStepUpPct', v)}
        suffix="%"
        placeholder="10"
        hint="Percentage by which your SIP increases each year (0 for flat SIP)"
        error={errors.annualStepUpPct}
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
        label="Investment Tenure"
        value={fields.tenureYears}
        onChange={(v) => setField('tenureYears', v)}
        suffix="years"
        placeholder="20"
        hint="Number of years you plan to invest"
        error={errors.tenureYears}
      />

      {/* Quick tenure shortcuts */}
      <div className={styles.shortcuts}>
        {[5, 10, 15, 20, 25, 30].map((y) => (
          <button
            key={y}
            className={[styles.chip, fields.tenureYears === String(y) ? styles.chipActive : ''].join(' ')}
            onClick={() => setField('tenureYears', String(y))}
          >
            {y}yr
          </button>
        ))}
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>

      <ResultCard rows={rows} empty={result === null} />

      {/* Year-by-year breakdown */}
      {result && result.yearlyBreakdown.length > 0 && (
        <div className={styles.breakdown}>
          <div className={styles.breakdownHeader}>
            <span>Year-by-Year Breakdown</span>
            <span className={styles.rowCount}>{result.yearlyBreakdown.length} years</span>
          </div>
          <div className={styles.colHeaders}>
            <span>Yr</span>
            <span>Monthly SIP</span>
            <span>Invested</span>
            <span>Value</span>
          </div>
          <div className={styles.rows}>
            {(showBreakdown ? result.yearlyBreakdown : result.yearlyBreakdown.slice(0, 10)).map((row) => (
              <div key={row.year} className={styles.row}>
                <span className={styles.yr}>{row.year}</span>
                <span>{row.monthlyContribFmt}</span>
                <span>{row.totalInvestedFmt}</span>
                <span className={styles.value}>{row.projectedValueFmt}</span>
              </div>
            ))}
          </div>
          {!showBreakdown && result.yearlyBreakdown.length > 10 && (
            <button className={styles.showAll} onClick={() => setShowBreakdown(true)}>
              Show all {result.yearlyBreakdown.length} years ↓
            </button>
          )}
        </div>
      )}
    </CalculatorShell>
  )
}
