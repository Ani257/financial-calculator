/**
 * FinCalc — Loans Calculation Engine
 *
 * Pure TypeScript. No React, no side effects, no I/O.
 * Every function is deterministic: same inputs → same outputs.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtCurrency = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const fmtInt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function currency(v: number): string {
  return `$${fmtCurrency.format(v)}`
}

function pct(v: number): string {
  return `${fmtCurrency.format(v)}%`
}

// ─────────────────────────────────────────────────────────────────────────────
// EMI Calculator
// ─────────────────────────────────────────────────────────────────────────────

export interface EMIInputs {
  /** Loan principal amount */
  principal: number
  /** Annual interest rate (e.g. 8.5 for 8.5%) */
  annualRate: number
  /** Loan tenure in months */
  tenureMonths: number
}

export interface EMIResult {
  monthlyEMI: number
  totalPayment: number
  totalInterest: number
  principalPct: number
  interestPct: number

  monthlyEMIFmt: string
  totalPaymentFmt: string
  totalInterestFmt: string
  principalPctFmt: string
  interestPctFmt: string
  principalFmt: string
}

export function validateEMI(
  inputs: EMIInputs
): Array<{ field: keyof EMIInputs; message: string }> {
  const errors: Array<{ field: keyof EMIInputs; message: string }> = []

  if (isNaN(inputs.principal) || inputs.principal <= 0)
    errors.push({ field: 'principal', message: 'Must be greater than zero' })

  if (isNaN(inputs.annualRate) || inputs.annualRate <= 0 || inputs.annualRate > 100)
    errors.push({ field: 'annualRate', message: 'Must be between 0.01 and 100' })

  if (isNaN(inputs.tenureMonths) || inputs.tenureMonths <= 0 || !Number.isInteger(inputs.tenureMonths))
    errors.push({ field: 'tenureMonths', message: 'Must be a whole number greater than zero' })

  return errors
}

export function calcEMI(inputs: EMIInputs): EMIResult {
  const { principal, annualRate, tenureMonths } = inputs
  const r = annualRate / 12 / 100   // monthly rate

  let monthlyEMI: number
  if (r === 0) {
    // Zero-interest edge case
    monthlyEMI = principal / tenureMonths
  } else {
    const factor = Math.pow(1 + r, tenureMonths)
    monthlyEMI = (principal * r * factor) / (factor - 1)
  }

  const totalPayment  = monthlyEMI * tenureMonths
  const totalInterest = totalPayment - principal
  const principalPct  = (principal / totalPayment) * 100
  const interestPct   = (totalInterest / totalPayment) * 100

  return {
    monthlyEMI,
    totalPayment,
    totalInterest,
    principalPct,
    interestPct,

    monthlyEMIFmt:    currency(monthlyEMI),
    totalPaymentFmt:  currency(totalPayment),
    totalInterestFmt: currency(totalInterest),
    principalPctFmt:  pct(principalPct),
    interestPctFmt:   pct(interestPct),
    principalFmt:     currency(principal),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Amortization Schedule
// ─────────────────────────────────────────────────────────────────────────────

export interface AmortizationRow {
  month: number
  payment: number
  principalPaid: number
  interestPaid: number
  remainingBalance: number

  paymentFmt: string
  principalPaidFmt: string
  interestPaidFmt: string
  remainingBalanceFmt: string
}

export interface AmortizationResult extends EMIResult {
  schedule: AmortizationRow[]
}

/** Reuses EMI inputs — same shape, same validation */
export { validateEMI as validateAmortization }

export function calcAmortization(inputs: EMIInputs): AmortizationResult {
  const emiResult = calcEMI(inputs)
  const { principal, annualRate, tenureMonths } = inputs
  const r = annualRate / 12 / 100
  const { monthlyEMI } = emiResult

  const schedule: AmortizationRow[] = []
  let balance = principal

  for (let month = 1; month <= tenureMonths; month++) {
    const interestPaid   = balance * r
    // Final month: pay off exact remaining balance to avoid floating-point drift
    const principalPaid  = month === tenureMonths
      ? balance
      : Math.min(monthlyEMI - interestPaid, balance)
    const payment        = principalPaid + interestPaid
    balance             -= principalPaid
    if (balance < 0.005) balance = 0   // clamp floating-point noise

    schedule.push({
      month,
      payment,
      principalPaid,
      interestPaid,
      remainingBalance: balance,

      paymentFmt:          currency(payment),
      principalPaidFmt:    currency(principalPaid),
      interestPaidFmt:     currency(interestPaid),
      remainingBalanceFmt: currency(balance),
    })
  }

  return { ...emiResult, schedule }
}

// ─────────────────────────────────────────────────────────────────────────────
// Debt Consolidation
// ─────────────────────────────────────────────────────────────────────────────

export interface ExistingDebt {
  id: string
  label: string
  balance: number
  annualRate: number
  /** Current monthly payment (EMI) */
  monthlyPayment: number
}

export interface DebtConsolidationInputs {
  existingDebts: ExistingDebt[]
  /** Annual rate for the consolidated loan */
  newAnnualRate: number
  /** Tenure of consolidated loan in months */
  newTenureMonths: number
}

export interface DebtConsolidationResult {
  /** Sum of all existing balances */
  totalDebtBalance: number
  /** Sum of all existing monthly payments */
  oldTotalMonthlyPayment: number
  /** EMI on the consolidated loan */
  newMonthlyEMI: number
  /** Monthly cash-flow change (positive = savings) */
  monthlySavings: number
  /** Total interest across all old debts (estimated to payoff) */
  oldTotalInterest: number
  /** Total interest on consolidated loan */
  newTotalInterest: number
  /** Interest saved (positive = saved, negative = costs more) */
  interestDelta: number
  /** Weighted average rate of existing debts */
  weightedAvgRate: number

  // Formatted
  totalDebtBalanceFmt: string
  oldTotalMonthlyPaymentFmt: string
  newMonthlyEMIFmt: string
  monthlySavingsFmt: string
  oldTotalInterestFmt: string
  newTotalInterestFmt: string
  interestDeltaFmt: string
  weightedAvgRateFmt: string
  newTenureLabel: string
}

export function validateDebtConsolidation(
  inputs: DebtConsolidationInputs
): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = []

  if (inputs.existingDebts.length === 0)
    errors.push({ field: 'existingDebts', message: 'Add at least one existing debt' })

  for (const debt of inputs.existingDebts) {
    if (isNaN(debt.balance) || debt.balance <= 0)
      errors.push({ field: `${debt.id}.balance`, message: `${debt.label}: balance must be > 0` })
    if (isNaN(debt.annualRate) || debt.annualRate <= 0)
      errors.push({ field: `${debt.id}.annualRate`, message: `${debt.label}: rate must be > 0` })
    if (isNaN(debt.monthlyPayment) || debt.monthlyPayment <= 0)
      errors.push({ field: `${debt.id}.monthlyPayment`, message: `${debt.label}: payment must be > 0` })
  }

  if (isNaN(inputs.newAnnualRate) || inputs.newAnnualRate <= 0 || inputs.newAnnualRate > 100)
    errors.push({ field: 'newAnnualRate', message: 'Must be between 0.01 and 100' })

  if (isNaN(inputs.newTenureMonths) || inputs.newTenureMonths <= 0)
    errors.push({ field: 'newTenureMonths', message: 'Must be greater than zero' })

  return errors
}

export function calcDebtConsolidation(inputs: DebtConsolidationInputs): DebtConsolidationResult {
  const { existingDebts, newAnnualRate, newTenureMonths } = inputs

  const totalDebtBalance      = existingDebts.reduce((s, d) => s + d.balance, 0)
  const oldTotalMonthlyPayment = existingDebts.reduce((s, d) => s + d.monthlyPayment, 0)

  // Weighted average rate (weighted by balance)
  const weightedAvgRate = existingDebts.reduce((s, d) => s + d.annualRate * d.balance, 0) / totalDebtBalance

  // Estimate total interest on old debts:
  // For each debt, approximate months to payoff then sum interest
  let oldTotalInterest = 0
  for (const debt of existingDebts) {
    const r = debt.annualRate / 12 / 100
    if (r === 0 || debt.monthlyPayment <= 0) {
      oldTotalInterest += 0
      continue
    }
    // Months to payoff: n = -ln(1 - r*B/P) / ln(1+r)
    const ratio = (r * debt.balance) / debt.monthlyPayment
    if (ratio >= 1) {
      // Payment doesn't cover interest — estimate with 360 months
      oldTotalInterest += debt.monthlyPayment * 360 - debt.balance
    } else {
      const monthsLeft = -Math.log(1 - ratio) / Math.log(1 + r)
      oldTotalInterest += debt.monthlyPayment * monthsLeft - debt.balance
    }
  }

  // New consolidated loan
  const newEMIResult   = calcEMI({ principal: totalDebtBalance, annualRate: newAnnualRate, tenureMonths: newTenureMonths })
  const newMonthlyEMI  = newEMIResult.monthlyEMI
  const newTotalInterest = newEMIResult.totalInterest

  const monthlySavings  = oldTotalMonthlyPayment - newMonthlyEMI
  const interestDelta   = oldTotalInterest - newTotalInterest  // positive = you save money

  const yrs = Math.floor(newTenureMonths / 12)
  const mos = newTenureMonths % 12
  const newTenureLabel = yrs > 0
    ? `${yrs}yr${yrs > 1 ? 's' : ''}${mos > 0 ? ` ${mos}mo` : ''}`
    : `${mos} months`

  return {
    totalDebtBalance,
    oldTotalMonthlyPayment,
    newMonthlyEMI,
    monthlySavings,
    oldTotalInterest,
    newTotalInterest,
    interestDelta,
    weightedAvgRate,

    totalDebtBalanceFmt:      currency(totalDebtBalance),
    oldTotalMonthlyPaymentFmt: currency(oldTotalMonthlyPayment),
    newMonthlyEMIFmt:         currency(newMonthlyEMI),
    monthlySavingsFmt:        `${monthlySavings >= 0 ? '+' : ''}${currency(monthlySavings)}`,
    oldTotalInterestFmt:      currency(Math.max(0, oldTotalInterest)),
    newTotalInterestFmt:      currency(newTotalInterest),
    interestDeltaFmt:         `${interestDelta >= 0 ? 'Save ' : 'Cost '}${currency(Math.abs(interestDelta))}`,
    weightedAvgRateFmt:       pct(weightedAvgRate),
    newTenureLabel,
  }
}

export { fmtInt }
