import { useState } from 'react'
import CalculatorShell from '../../../components/CalculatorShell/CalculatorShell'
import NumericInput from '../../../components/NumericInput/NumericInput'
import ResultCard, { type ResultRow } from '../../../components/ResultCard/ResultCard'
import Button from '../../../components/Button/Button'
import {
  calcDebtConsolidation,
  validateDebtConsolidation,
  type ExistingDebt,
  type DebtConsolidationInputs,
} from '../../../engine/loans'
import styles from './DebtConsolidation.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DebtField {
  id: string
  label: string
  balance: string
  annualRate: string
  monthlyPayment: string
}

function makeDebt(label: string): DebtField {
  return { id: crypto.randomUUID(), label, balance: '', annualRate: '', monthlyPayment: '' }
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DebtConsolidationCalculator() {
  const [debts, setDebts]         = useState<DebtField[]>([makeDebt('Debt 1'), makeDebt('Debt 2')])
  const [newRate, setNewRate]     = useState('')
  const [newTenure, setNewTenure] = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [result, setResult]       = useState<ReturnType<typeof calcDebtConsolidation> | null>(null)

  // ── Debt row management ───────────────────────────────────────────────────
  function updateDebt(id: string, field: keyof Omit<DebtField, 'id' | 'label'>, value: string) {
    setDebts((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d))
    setErrors((prev) => { const n = { ...prev }; delete n[`${id}.${field}`]; return n })
  }

  function addDebt() {
    setDebts((prev) => [...prev, makeDebt(`Debt ${prev.length + 1}`)])
  }

  function removeDebt(id: string) {
    setDebts((prev) => prev.filter((d) => d.id !== id))
  }

  // ── Calculate ─────────────────────────────────────────────────────────────
  function handleReset() {
    setDebts([makeDebt('Debt 1'), makeDebt('Debt 2')])
    setNewRate('')
    setNewTenure('')
    setErrors({})
    setResult(null)
  }

  function handleCalculate() {
    const existingDebts: ExistingDebt[] = debts.map((d) => ({
      id:             d.id,
      label:          d.label,
      balance:        parseFloat(d.balance)        || 0,
      annualRate:     parseFloat(d.annualRate)      || 0,
      monthlyPayment: parseFloat(d.monthlyPayment)  || 0,
    }))

    const inputs: DebtConsolidationInputs = {
      existingDebts,
      newAnnualRate:   parseFloat(newRate)   || 0,
      newTenureMonths: Math.round(parseFloat(newTenure) || 0),
    }

    const errs = validateDebtConsolidation(inputs)
    if (errs.length > 0) {
      const mapped: Record<string, string> = {}
      for (const e of errs) mapped[e.field] = e.message
      setErrors(mapped)
      return
    }
    setErrors({})
    setResult(calcDebtConsolidation(inputs))
  }

  // ── Result rows ───────────────────────────────────────────────────────────
  const summaryRows: ResultRow[] = result
    ? [
        { label: 'New Monthly EMI',      value: result.newMonthlyEMIFmt,         highlight: true },
        { label: 'Old Total Payment',    value: result.oldTotalMonthlyPaymentFmt },
        { label: 'Monthly Savings',      value: result.monthlySavingsFmt },
        { label: 'Total Debt Balance',   value: result.totalDebtBalanceFmt },
        { label: 'Old Interest (est.)',  value: result.oldTotalInterestFmt },
        { label: 'New Total Interest',   value: result.newTotalInterestFmt },
        { label: 'Interest Impact',      value: result.interestDeltaFmt },
        { label: 'Weighted Avg Rate',    value: result.weightedAvgRateFmt },
      ]
    : []

  const resultRows: Array<{ label: string; value: string }> | null = result
    ? summaryRows.map((r) => ({ label: r.label, value: r.value }))
    : null

  const inputSnapshot = {
    debts: debts.map((d) => `${d.label}:${d.balance}@${d.annualRate}%`).join(','),
    newRate,
    newTenure,
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <CalculatorShell
      calculatorId="debt-consolidation"
      calculatorName="Debt Consolidation"
      description="Compare your existing debts against a single consolidation loan."
      result={resultRows}
      inputs={inputSnapshot}
      onReset={handleReset}
    >
      {/* Existing debts */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Existing Debts</p>
        {errors['existingDebts'] && (
          <p className={styles.globalError}>{errors['existingDebts']}</p>
        )}

        {debts.map((debt) => (
          <div key={debt.id} className={styles.debtCard}>
            <div className={styles.debtHeader}>
              <span className={styles.debtLabel}>{debt.label}</span>
              {debts.length > 1 && (
                <button
                  className={styles.removeBtn}
                  onClick={() => removeDebt(debt.id)}
                  aria-label={`Remove ${debt.label}`}
                >
                  <IconTrash />
                </button>
              )}
            </div>
            <div className={styles.debtFields}>
              <NumericInput
                label="Balance"
                value={debt.balance}
                onChange={(v) => updateDebt(debt.id, 'balance', v)}
                prefix="₹"
                placeholder="10,000"
                error={errors[`${debt.id}.balance`]}
              />
              <NumericInput
                label="Annual Rate"
                value={debt.annualRate}
                onChange={(v) => updateDebt(debt.id, 'annualRate', v)}
                suffix="%"
                placeholder="18"
                error={errors[`${debt.id}.annualRate`]}
              />
              <NumericInput
                label="Monthly Payment"
                value={debt.monthlyPayment}
                onChange={(v) => updateDebt(debt.id, 'monthlyPayment', v)}
                prefix="₹"
                placeholder="300"
                error={errors[`${debt.id}.monthlyPayment`]}
              />
            </div>
          </div>
        ))}

        <button className={styles.addBtn} onClick={addDebt} disabled={debts.length >= 8}>
          <IconPlus />
          Add another debt
        </button>
      </div>

      {/* Consolidated loan */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Consolidated Loan</p>
        <NumericInput
          label="New Annual Rate"
          value={newRate}
          onChange={(v) => { setNewRate(v); setErrors((p) => { const n = { ...p }; delete n['newAnnualRate']; return n }) }}
          suffix="%"
          placeholder="10"
          hint="Interest rate on the new single loan"
          error={errors['newAnnualRate']}
        />
        <NumericInput
          label="New Tenure"
          value={newTenure}
          onChange={(v) => { setNewTenure(v); setErrors((p) => { const n = { ...p }; delete n['newTenureMonths']; return n }) }}
          suffix="months"
          placeholder="60"
          hint="Repayment period for the consolidated loan"
          error={errors['newTenureMonths']}
        />
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
        Compare & Consolidate
      </Button>

      <ResultCard rows={summaryRows} empty={result === null} />

      {/* Savings / cost banner */}
      {result && (
        <div
          className={styles.banner}
          data-positive={result.monthlySavings > 0 ? 'true' : 'false'}
        >
          {result.monthlySavings > 0
            ? `✓ You save ${result.monthlySavingsFmt} per month — ${result.interestDeltaFmt} in total interest over ${result.newTenureLabel}.`
            : `⚠ Monthly payment increases by ${result.newMonthlyEMIFmt}. Consolidating may cost more in total interest — review terms carefully.`}
        </div>
      )}
    </CalculatorShell>
  )
}
