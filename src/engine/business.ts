/**
 * FinCalc — Business Calculation Engine
 *
 * Pure TypeScript. No React, no side effects, no I/O.
 * Every function is deterministic: same inputs → same outputs.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})


export function formatCurrency(value: number): string {
  return `₹${fmt.format(value)}`
}

export function formatMonths(months: number): string {
  const rounded = Math.floor(months)
  const years   = Math.floor(rounded / 12)
  const rem     = rounded % 12

  if (rounded <= 0) return '0 months'
  if (years === 0)  return `${rounded} month${rounded === 1 ? '' : 's'}`
  if (rem === 0)    return `${years} year${years === 1 ? '' : 's'}`
  return `${years}yr ${rem}mo`
}

export function formatRunwayDate(months: number): string {
  if (months <= 0 || !isFinite(months)) return '—'
  const d = new Date()
  d.setMonth(d.getMonth() + Math.floor(months))
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(d)
}

// ─────────────────────────────────────────────────────────────────────────────
// Burn Rate
// ─────────────────────────────────────────────────────────────────────────────

export interface BurnRateInputs {
  /** Current cash balance in the bank */
  currentCash: number
  /** Total monthly revenue / inflows */
  monthlyRevenue: number
  /** Total monthly expenses / outflows (gross) */
  monthlyExpenses: number
}

export type BurnRateResultStatus =
  | 'ok'
  | 'cash_flow_positive'
  | 'zero_cash'
  | 'error'

export interface BurnRateResult {
  status: BurnRateResultStatus
  /** Total cash spent per month regardless of revenue */
  grossBurnRate: number
  /** Net cash consumed per month (expenses − revenue) */
  netBurnRate: number
  /** Months of runway at the net burn rate. Infinity if cash-flow positive. */
  cashRunwayMonths: number

  // Formatted strings for display
  grossBurnRateFmt: string
  netBurnRateFmt: string
  cashRunwayFmt: string
  runwayDateFmt: string
  currentCashFmt: string
  monthlyRevenueFmt: string
  monthlyExpensesFmt: string
  monthlySurplusFmt: string
}

export interface BurnRateValidationError {
  field: keyof BurnRateInputs
  message: string
}

export function validateBurnRate(
  inputs: BurnRateInputs
): BurnRateValidationError[] {
  const errors: BurnRateValidationError[] = []

  if (isNaN(inputs.currentCash) || inputs.currentCash < 0)
    errors.push({ field: 'currentCash', message: 'Must be zero or greater' })

  if (isNaN(inputs.monthlyRevenue) || inputs.monthlyRevenue < 0)
    errors.push({ field: 'monthlyRevenue', message: 'Must be zero or greater' })

  if (isNaN(inputs.monthlyExpenses) || inputs.monthlyExpenses <= 0)
    errors.push({ field: 'monthlyExpenses', message: 'Must be greater than zero' })

  return errors
}

export function calcBurnRate(inputs: BurnRateInputs): BurnRateResult {
  const { currentCash, monthlyRevenue, monthlyExpenses } = inputs

  const grossBurnRate  = monthlyExpenses
  const netBurnRate    = monthlyExpenses - monthlyRevenue
  const monthlySurplus = monthlyRevenue - monthlyExpenses

  let cashRunwayMonths: number
  let status: BurnRateResultStatus

  if (netBurnRate <= 0) {
    // Revenue covers or exceeds expenses → cash-flow positive
    cashRunwayMonths = Infinity
    status = 'cash_flow_positive'
  } else if (currentCash <= 0) {
    cashRunwayMonths = 0
    status = 'zero_cash'
  } else {
    cashRunwayMonths = currentCash / netBurnRate
    status = 'ok'
  }

  return {
    status,
    grossBurnRate,
    netBurnRate,
    cashRunwayMonths,

    grossBurnRateFmt:    formatCurrency(grossBurnRate),
    netBurnRateFmt:      netBurnRate > 0 ? formatCurrency(netBurnRate) : '—',
    cashRunwayFmt:       isFinite(cashRunwayMonths)
                           ? formatMonths(cashRunwayMonths)
                           : '∞ (cash-flow positive)',
    runwayDateFmt:       isFinite(cashRunwayMonths)
                           ? formatRunwayDate(cashRunwayMonths)
                           : 'N/A',
    currentCashFmt:      formatCurrency(currentCash),
    monthlyRevenueFmt:   formatCurrency(monthlyRevenue),
    monthlyExpensesFmt:  formatCurrency(monthlyExpenses),
    monthlySurplusFmt:   `${monthlySurplus >= 0 ? '+' : ''}${formatCurrency(monthlySurplus)}`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical Burn Rate (from two cash snapshots)
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoricalBurnInputs {
  startingCash: number
  endingCash: number
  periodMonths: number
}

export interface HistoricalBurnResult {
  avgMonthlyBurn: number
  totalCashBurned: number
  remainingRunwayMonths: number

  avgMonthlyBurnFmt: string
  totalCashBurnedFmt: string
  remainingRunwayFmt: string
  runwayDateFmt: string
}

export function validateHistoricalBurn(
  inputs: HistoricalBurnInputs
): Array<{ field: keyof HistoricalBurnInputs; message: string }> {
  const errors: Array<{ field: keyof HistoricalBurnInputs; message: string }> = []

  if (isNaN(inputs.startingCash) || inputs.startingCash <= 0)
    errors.push({ field: 'startingCash', message: 'Must be greater than zero' })

  if (isNaN(inputs.endingCash) || inputs.endingCash < 0)
    errors.push({ field: 'endingCash', message: 'Must be zero or greater' })

  if (inputs.endingCash >= inputs.startingCash)
    errors.push({ field: 'endingCash', message: 'Must be less than starting cash (cash was burned)' })

  if (isNaN(inputs.periodMonths) || inputs.periodMonths <= 0)
    errors.push({ field: 'periodMonths', message: 'Must be greater than zero' })

  return errors
}

export function calcHistoricalBurn(inputs: HistoricalBurnInputs): HistoricalBurnResult {
  const { startingCash, endingCash, periodMonths } = inputs

  const totalCashBurned    = startingCash - endingCash
  const avgMonthlyBurn     = totalCashBurned / periodMonths
  const remainingRunwayMonths = avgMonthlyBurn > 0 ? endingCash / avgMonthlyBurn : Infinity

  return {
    avgMonthlyBurn,
    totalCashBurned,
    remainingRunwayMonths,
    avgMonthlyBurnFmt:      formatCurrency(avgMonthlyBurn),
    totalCashBurnedFmt:     formatCurrency(totalCashBurned),
    remainingRunwayFmt:     isFinite(remainingRunwayMonths)
                              ? formatMonths(remainingRunwayMonths)
                              : '∞',
    runwayDateFmt:          formatRunwayDate(remainingRunwayMonths),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Break-Even
// ─────────────────────────────────────────────────────────────────────────────

export interface BreakEvenInputs {
  /** Total monthly fixed costs (rent, salaries, insurance, etc.) */
  fixedCosts: number
  /** Variable cost incurred per unit produced/sold */
  variableCostPerUnit: number
  /** Revenue received per unit sold */
  sellingPricePerUnit: number
}

export interface BreakEvenResult {
  /** Units needed to cover all costs */
  breakEvenUnits: number
  /** Revenue needed to cover all costs */
  breakEvenRevenue: number
  /** Revenue minus variable cost, per unit */
  contributionMargin: number
  /** Contribution margin as a percentage of selling price */
  contributionMarginPct: number

  // Formatted strings for display
  breakEvenUnitsFmt: string
  breakEvenRevenueFmt: string
  contributionMarginFmt: string
  contributionMarginPctFmt: string
  fixedCostsFmt: string
}

export function validateBreakEven(
  inputs: BreakEvenInputs
): Array<{ field: keyof BreakEvenInputs; message: string }> {
  const errors: Array<{ field: keyof BreakEvenInputs; message: string }> = []

  if (isNaN(inputs.fixedCosts) || inputs.fixedCosts <= 0)
    errors.push({ field: 'fixedCosts', message: 'Must be greater than zero' })

  if (isNaN(inputs.variableCostPerUnit) || inputs.variableCostPerUnit < 0)
    errors.push({ field: 'variableCostPerUnit', message: 'Must be zero or greater' })

  if (isNaN(inputs.sellingPricePerUnit) || inputs.sellingPricePerUnit <= 0)
    errors.push({ field: 'sellingPricePerUnit', message: 'Must be greater than zero' })

  if (
    !isNaN(inputs.sellingPricePerUnit) &&
    !isNaN(inputs.variableCostPerUnit) &&
    inputs.sellingPricePerUnit > 0 &&
    inputs.variableCostPerUnit >= inputs.sellingPricePerUnit
  ) {
    errors.push({
      field: 'variableCostPerUnit',
      message: 'Variable cost must be less than selling price (negative margin)',
    })
  }

  return errors
}

export function calcBreakEven(inputs: BreakEvenInputs): BreakEvenResult {
  const { fixedCosts, variableCostPerUnit, sellingPricePerUnit } = inputs

  const contributionMargin    = sellingPricePerUnit - variableCostPerUnit
  const contributionMarginPct = (contributionMargin / sellingPricePerUnit) * 100
  const breakEvenUnits        = fixedCosts / contributionMargin
  const breakEvenRevenue      = breakEvenUnits * sellingPricePerUnit

  const unitsFmt = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })

  return {
    breakEvenUnits,
    breakEvenRevenue,
    contributionMargin,
    contributionMarginPct,

    breakEvenUnitsFmt:        `${unitsFmt.format(breakEvenUnits)} units`,
    breakEvenRevenueFmt:      formatCurrency(breakEvenRevenue),
    contributionMarginFmt:    formatCurrency(contributionMargin),
    contributionMarginPctFmt: `${fmt.format(contributionMarginPct)}%`,
    fixedCostsFmt:            formatCurrency(fixedCosts),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cash Runway  (focused calculator — takes burn rate as a direct input)
// ─────────────────────────────────────────────────────────────────────────────

export interface CashRunwayInputs {
  /** Current cash balance */
  currentCash: number
  /** Net monthly burn rate (expenses minus revenue) */
  monthlyBurnRate: number
}

export interface CashRunwayResult {
  runwayMonths: number
  runwayFmt: string
  runwayDateFmt: string
  currentCashFmt: string
  monthlyBurnRateFmt: string
  /** Projected cash at 3 / 6 / 12 month marks */
  projections: Array<{ label: string; value: string; exhausted: boolean }>
}

export function validateCashRunway(
  inputs: CashRunwayInputs
): Array<{ field: keyof CashRunwayInputs; message: string }> {
  const errors: Array<{ field: keyof CashRunwayInputs; message: string }> = []

  if (isNaN(inputs.currentCash) || inputs.currentCash <= 0)
    errors.push({ field: 'currentCash', message: 'Must be greater than zero' })

  if (isNaN(inputs.monthlyBurnRate) || inputs.monthlyBurnRate <= 0)
    errors.push({ field: 'monthlyBurnRate', message: 'Must be greater than zero (net cash consumed per month)' })

  return errors
}

export function calcCashRunway(inputs: CashRunwayInputs): CashRunwayResult {
  const { currentCash, monthlyBurnRate } = inputs
  const runwayMonths = currentCash / monthlyBurnRate

  const milestones = [3, 6, 9, 12, 18, 24]
  const projections = milestones
    .filter((m) => m <= Math.ceil(runwayMonths) + 6)
    .slice(0, 4)
    .map((m) => {
      const remaining = currentCash - monthlyBurnRate * m
      const exhausted = remaining <= 0
      return {
        label: `${m} months`,
        value: exhausted ? '₹0 (exhausted)' : formatCurrency(remaining),
        exhausted,
      }
    })

  return {
    runwayMonths,
    runwayFmt: formatMonths(runwayMonths),
    runwayDateFmt: formatRunwayDate(runwayMonths),
    currentCashFmt: formatCurrency(currentCash),
    monthlyBurnRateFmt: formatCurrency(monthlyBurnRate),
    projections,
  }
}
