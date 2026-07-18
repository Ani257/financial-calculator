import { useState } from 'react'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcBurnRate,
  validateBurnRate,
  type BurnRateInputs,
  type BurnRateResult,
} from '../../../engine/business'
import styles from './BurnRate.module.css'

// ─── Tab types ────────────────────────────────────────────────────────────────
type Mode = 'standard' | 'historical'

// ─── Default field values ─────────────────────────────────────────────────────
const EMPTY: Record<string, string> = {
  currentCash:      '',
  monthlyRevenue:   '',
  monthlyExpenses:  '',
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BurnRateCalculator() {
  const [mode, setMode] = useState<Mode>('standard')
  const [fields, setFields]   = useState({ ...EMPTY })
  const [errors, setErrors]   = useState<Partial<Record<keyof BurnRateInputs, string>>>({})
  const [result, setResult]   = useState<BurnRateResult | null>(null)

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    // Clear field-level error on change
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleReset() {
    setFields({ ...EMPTY })
    setErrors({})
    setResult(null)
  }

  function handleCalculate() {
    const inputs: BurnRateInputs = {
      currentCash:     parseFloat(fields.currentCash)     || 0,
      monthlyRevenue:  parseFloat(fields.monthlyRevenue)  || 0,
      monthlyExpenses: parseFloat(fields.monthlyExpenses) || 0,
    }

    const validationErrors = validateBurnRate(inputs)
    if (validationErrors.length > 0) {
      const mapped: Partial<Record<keyof BurnRateInputs, string>> = {}
      for (const e of validationErrors) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }

    setErrors({})
    setResult(calcBurnRate(inputs))
  }

  // ── Build result rows for CalculatorShell (copy/export/favorites) ──────────
  const resultRows: Array<{ label: string; value: string }> | null = result
    ? buildResultRows(result).map((r) => ({ label: r.label, value: r.value }))
    : null

  // ── Build result rows for ResultCard (includes highlight flag) ────────────
  const displayRows: ResultRow[] = result ? buildResultRows(result) : []

  return (
    <CalculatorShell
      calculatorId="burn-rate"
      calculatorName="Burn Rate"
      description="How fast your business consumes cash — and how long you have left."
      result={resultRows}
      inputs={fields}
      onReset={handleReset}
    >
      {/* Mode toggle */}
      <div className={styles.tabs}>
        <button
          className={[styles.tab, mode === 'standard' ? styles.tabActive : ''].join(' ')}
          onClick={() => { setMode('standard'); handleReset() }}
        >
          Standard
        </button>
        <button
          className={[styles.tab, mode === 'historical' ? styles.tabActive : ''].join(' ')}
          onClick={() => { setMode('historical'); handleReset() }}
        >
          Historical
        </button>
      </div>

      {/* Standard mode */}
      {mode === 'standard' && (
        <>
          <NumericInput
            label="Current Cash Balance"
            value={fields.currentCash}
            onChange={(v) => setField('currentCash', v)}
            prefix="₹"
            placeholder="500,000"
            hint="Total cash available today"
            error={errors.currentCash}
          />
          <NumericInput
            label="Monthly Revenue"
            value={fields.monthlyRevenue}
            onChange={(v) => setField('monthlyRevenue', v)}
            prefix="₹"
            placeholder="0"
            hint="Average monthly inflows (use 0 for pre-revenue)"
            error={errors.monthlyRevenue}
          />
          <NumericInput
            label="Monthly Expenses"
            value={fields.monthlyExpenses}
            onChange={(v) => setField('monthlyExpenses', v)}
            prefix="₹"
            placeholder="80,000"
            hint="Total monthly cash outflows (salaries, rent, SaaS, etc.)"
            error={errors.monthlyExpenses}
          />
        </>
      )}

      {/* Historical mode — uses separate component to keep state isolated */}
      {mode === 'historical' && (
        <HistoricalMode />
      )}

      {/* Calculate button */}
      {mode === 'standard' && (
        <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
          Calculate
        </Button>
      )}

      {/* Results */}
      {mode === 'standard' && (
        <ResultCard rows={displayRows} empty={result === null} />
      )}

      {/* Status banner */}
      {result && result.status === 'cash_flow_positive' && (
        <div className={styles.banner} data-variant="positive">
          ✓ Revenue exceeds expenses — your business is cash-flow positive. No burn to report.
        </div>
      )}
      {result && result.status === 'zero_cash' && (
        <div className={styles.banner} data-variant="warning">
          ⚠ Current cash is $0 — runway is exhausted.
        </div>
      )}
    </CalculatorShell>
  )
}

// ─── Historical sub-component ─────────────────────────────────────────────────

import {
  calcHistoricalBurn,
  validateHistoricalBurn,
  type HistoricalBurnInputs,
} from '../../../engine/business'

function HistoricalMode() {
  const [fields, setFields] = useState({ startingCash: '', endingCash: '', periodMonths: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof HistoricalBurnInputs, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof calcHistoricalBurn> | null>(null)

  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleCalculate() {
    const inputs: HistoricalBurnInputs = {
      startingCash:  parseFloat(fields.startingCash)  || 0,
      endingCash:    parseFloat(fields.endingCash)    || 0,
      periodMonths:  parseFloat(fields.periodMonths)  || 0,
    }
    const errs = validateHistoricalBurn(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof HistoricalBurnInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcHistoricalBurn(inputs))
  }

  const rows: ResultRow[] = result
    ? [
        { label: 'Avg Monthly Burn',    value: result.avgMonthlyBurnFmt,      highlight: true },
        { label: 'Total Cash Burned',   value: result.totalCashBurnedFmt },
        { label: 'Remaining Runway',    value: result.remainingRunwayFmt },
        { label: 'Runway End (approx)', value: result.runwayDateFmt },
      ]
    : []

  return (
    <>
      <NumericInput
        label="Starting Cash"
        value={fields.startingCash}
        onChange={(v) => setField('startingCash', v)}
        prefix="₹"
        placeholder="1,000,000"
        hint="Cash balance at the beginning of the period"
        error={errors.startingCash}
      />
      <NumericInput
        label="Ending Cash"
        value={fields.endingCash}
        onChange={(v) => setField('endingCash', v)}
        prefix="₹"
        placeholder="640,000"
        hint="Cash balance at the end of the period"
        error={errors.endingCash}
      />
      <NumericInput
        label="Period (months)"
        value={fields.periodMonths}
        onChange={(v) => setField('periodMonths', v)}
        suffix="mo"
        placeholder="6"
        hint="Number of months between the two snapshots"
        error={errors.periodMonths}
      />
      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Calculate
      </Button>
      <ResultCard rows={rows} empty={result === null} />
    </>
  )
}

// ─── Result row builder ───────────────────────────────────────────────────────

function buildResultRows(r: BurnRateResult): ResultRow[] {
  const rows: ResultRow[] = [
    { label: 'Net Burn Rate / mo',  value: r.netBurnRate > 0 ? r.netBurnRateFmt : '—', highlight: true },
    { label: 'Gross Burn Rate / mo', value: r.grossBurnRateFmt },
    { label: 'Cash Runway',         value: r.cashRunwayFmt },
    { label: 'Runway End (approx)', value: r.runwayDateFmt },
    { label: 'Monthly Surplus/Deficit', value: r.monthlySurplusFmt },
  ]
  return rows
}
