import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcBurnRate,
  validateBurnRate,
  calcHistoricalBurn,
  validateHistoricalBurn,
  type BurnRateInputs,
  type BurnRateResult,
  type HistoricalBurnInputs,
  type HistoricalBurnResult,
} from '../../../engine/business'
import styles from './BurnRate.module.css'

// ─── Tab types ────────────────────────────────────────────────────────────────
type Mode = 'standard' | 'historical'

// ─── Default field values ─────────────────────────────────────────────────────
const STD_EMPTY = {
  currentCash:     '',
  monthlyRevenue:  '',
  monthlyExpenses: '',
}

const HIST_EMPTY = {
  startingCash:  '',
  endingCash:    '',
  periodMonths:  '',
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BurnRateCalculator() {
  const location = useLocation()

  const [mode, setMode] = useState<Mode>('standard')

  // Standard mode state
  const [fields, setFields]   = useState({ ...STD_EMPTY })
  const [errors, setErrors]   = useState<Partial<Record<keyof BurnRateInputs, string>>>({})
  const [result, setResult]   = useState<BurnRateResult | null>(null)

  // Historical mode state — lifted here so CalculatorShell always sees it
  const [histFields, setHistFields] = useState({ ...HIST_EMPTY })
  const [histErrors, setHistErrors] = useState<Partial<Record<keyof HistoricalBurnInputs, string>>>({})
  const [histResult, setHistResult] = useState<HistoricalBurnResult | null>(null)

  // ── Hydrate from favorites / recents navigation ───────────────────────────
  useEffect(() => {
    const saved = (location.state as { inputs?: Record<string, string> } | null)?.inputs
    if (!saved) return

    if (saved.mode === 'historical') {
      setMode('historical')
      const hf = {
        startingCash: saved.startingCash ?? '',
        endingCash:   saved.endingCash   ?? '',
        periodMonths: saved.periodMonths ?? '',
      }
      setHistFields(hf)
      const inputs: HistoricalBurnInputs = {
        startingCash:  parseFloat(hf.startingCash)  || 0,
        endingCash:    parseFloat(hf.endingCash)    || 0,
        periodMonths:  parseFloat(hf.periodMonths)  || 0,
      }
      if (!validateHistoricalBurn(inputs).length) setHistResult(calcHistoricalBurn(inputs))
    } else {
      setMode('standard')
      const sf = {
        currentCash:     saved.currentCash     ?? '',
        monthlyRevenue:  saved.monthlyRevenue  ?? '',
        monthlyExpenses: saved.monthlyExpenses ?? '',
      }
      setFields(sf)
      const inputs: BurnRateInputs = {
        currentCash:     parseFloat(sf.currentCash)     || 0,
        monthlyRevenue:  parseFloat(sf.monthlyRevenue)  || 0,
        monthlyExpenses: parseFloat(sf.monthlyExpenses) || 0,
      }
      if (!validateBurnRate(inputs).length) setResult(calcBurnRate(inputs))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Standard mode helpers ─────────────────────────────────────────────────
  function setField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleReset() {
    setFields({ ...STD_EMPTY }); setErrors({}); setResult(null)
    setHistFields({ ...HIST_EMPTY }); setHistErrors({}); setHistResult(null)
  }

  function handleCalculate() {
    const inputs: BurnRateInputs = {
      currentCash:     parseFloat(fields.currentCash)     || 0,
      monthlyRevenue:  parseFloat(fields.monthlyRevenue)  || 0,
      monthlyExpenses: parseFloat(fields.monthlyExpenses) || 0,
    }
    const errs = validateBurnRate(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof BurnRateInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcBurnRate(inputs))
  }

  // ── Historical mode helpers ───────────────────────────────────────────────
  function setHistField(key: string, value: string) {
    setHistFields((prev) => ({ ...prev, [key]: value }))
    setHistErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleHistCalculate() {
    const inputs: HistoricalBurnInputs = {
      startingCash:  parseFloat(histFields.startingCash)  || 0,
      endingCash:    parseFloat(histFields.endingCash)    || 0,
      periodMonths:  parseFloat(histFields.periodMonths)  || 0,
    }
    const errs = validateHistoricalBurn(inputs)
    if (errs.length > 0) {
      const mapped: Partial<Record<keyof HistoricalBurnInputs, string>> = {}
      for (const e of errs) mapped[e.field] = e.message
      setHistErrors(mapped)
      return
    }
    setHistErrors({})
    setHistResult(calcHistoricalBurn(inputs))
  }

  // ── Build result rows for CalculatorShell (copy / export / favorites) ─────
  const stdResultRows: Array<{ label: string; value: string }> | null = result
    ? buildResultRows(result).map((r) => ({ label: r.label, value: r.value }))
    : null

  const histResultRows: Array<{ label: string; value: string }> | null = histResult
    ? buildHistRows(histResult).map((r) => ({ label: r.label, value: r.value }))
    : null

  // Pass the active mode's result and inputs to CalculatorShell
  const shellResult = mode === 'standard' ? stdResultRows : histResultRows
  const shellInputs = mode === 'standard'
    ? { mode: 'standard', ...fields }
    : { mode: 'historical', ...histFields }

  return (
    <CalculatorShell
      calculatorId="burn-rate"
      calculatorName="Burn Rate"
      description="How fast your business consumes cash — and how long you have left."
      result={shellResult}
      inputs={shellInputs}
      onReset={handleReset}
    >
      {/* Mode toggle */}
      <div className={styles.tabs}>
        <button
          className={[styles.tab, mode === 'standard' ? styles.tabActive : ''].join(' ')}
          onClick={() => setMode('standard')}
        >
          Standard
        </button>
        <button
          className={[styles.tab, mode === 'historical' ? styles.tabActive : ''].join(' ')}
          onClick={() => setMode('historical')}
        >
          Historical
        </button>
      </div>

      {/* ── Standard mode ── */}
      {mode === 'standard' && (
        <>
          <NumericInput
            label="Current Cash Balance"
            value={fields.currentCash}
            onChange={(v) => setField('currentCash', v)}
            prefix="₹"
            placeholder="5,00,000"
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
          <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
            Calculate
          </Button>
          <ResultCard rows={result ? buildResultRows(result) : []} empty={result === null} />

          {result?.status === 'cash_flow_positive' && (
            <div className={styles.banner} data-variant="positive">
              ✓ Revenue exceeds expenses — your business is cash-flow positive. No burn to report.
            </div>
          )}
          {result?.status === 'zero_cash' && (
            <div className={styles.banner} data-variant="warning">
              ⚠ Current cash is ₹0 — runway is exhausted.
            </div>
          )}
        </>
      )}

      {/* ── Historical mode ── */}
      {mode === 'historical' && (
        <>
          <NumericInput
            label="Starting Cash"
            value={histFields.startingCash}
            onChange={(v) => setHistField('startingCash', v)}
            prefix="₹"
            placeholder="10,00,000"
            hint="Cash balance at the beginning of the period"
            error={histErrors.startingCash}
          />
          <NumericInput
            label="Ending Cash"
            value={histFields.endingCash}
            onChange={(v) => setHistField('endingCash', v)}
            prefix="₹"
            placeholder="6,40,000"
            hint="Cash balance at the end of the period"
            error={histErrors.endingCash}
          />
          <NumericInput
            label="Period (months)"
            value={histFields.periodMonths}
            onChange={(v) => setHistField('periodMonths', v)}
            suffix="mo"
            placeholder="6"
            hint="Number of months between the two snapshots"
            error={histErrors.periodMonths}
          />
          <Button variant="primary" size="lg" fullWidth onClick={handleHistCalculate}>
            Calculate
          </Button>
          <ResultCard
            rows={histResult ? buildHistRows(histResult) : []}
            empty={histResult === null}
          />
        </>
      )}
    </CalculatorShell>
  )
}

// ─── Result row builders ──────────────────────────────────────────────────────

function buildResultRows(r: BurnRateResult): ResultRow[] {
  return [
    { label: 'Net Burn Rate / mo',      value: r.netBurnRate > 0 ? r.netBurnRateFmt : '—', highlight: true },
    { label: 'Gross Burn Rate / mo',    value: r.grossBurnRateFmt },
    { label: 'Cash Runway',             value: r.cashRunwayFmt },
    { label: 'Runway End (approx)',     value: r.runwayDateFmt },
    { label: 'Monthly Surplus/Deficit', value: r.monthlySurplusFmt },
  ]
}

function buildHistRows(r: HistoricalBurnResult): ResultRow[] {
  return [
    { label: 'Avg Monthly Burn',    value: r.avgMonthlyBurnFmt,      highlight: true },
    { label: 'Total Cash Burned',   value: r.totalCashBurnedFmt },
    { label: 'Remaining Runway',    value: r.remainingRunwayFmt },
    { label: 'Runway End (approx)', value: r.runwayDateFmt },
  ]
}
