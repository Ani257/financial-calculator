/**
 * FinCalc — Investments Calculation Engine
 *
 * Pure TypeScript. No React, no side effects, no I/O.
 * Every function is deterministic: same inputs → same outputs.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtCurrency = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const fmtInt = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function currency(v: number): string {
  return `₹${fmtCurrency.format(v)}`
}

function pct(v: number, decimals = 2): string {
  return `${v.toFixed(decimals)}%`
}

// ─────────────────────────────────────────────────────────────────────────────
// Step-Up SIP Calculator
//
// Each year, the monthly contribution is stepped up by `stepUpPct` percent.
// Formula (year y, 0-indexed):
//   monthlyContrib(y) = initialMonthly × (1 + stepUpPct/100)^y
// Future value contribution of each month's investment:
//   FV = contrib × (1 + r)^monthsRemaining   where r = annualReturn/12/100
// ─────────────────────────────────────────────────────────────────────────────

export interface StepUpSIPInputs {
  /** Starting monthly investment */
  monthlyInvestment: number
  /** Annual percentage by which monthly SIP increases each year (e.g. 10 for 10%) */
  annualStepUpPct: number
  /** Expected annual return in percent (e.g. 12 for 12%) */
  annualReturnPct: number
  /** Investment tenure in years */
  tenureYears: number
}

export interface StepUpSIPYearRow {
  year: number
  monthlyContrib: number
  yearlyContrib: number
  totalInvested: number
  projectedValue: number

  monthlyContribFmt: string
  yearlyContribFmt: string
  totalInvestedFmt: string
  projectedValueFmt: string
}

export interface StepUpSIPResult {
  totalInvested: number
  estimatedWealth: number
  wealthGained: number
  absoluteReturn: number   // percentage: wealthGained / totalInvested × 100

  totalInvestedFmt: string
  estimatedWealthFmt: string
  wealthGainedFmt: string
  absoluteReturnFmt: string
  monthlyInvestmentFmt: string
  finalMonthlyContribFmt: string

  yearlyBreakdown: StepUpSIPYearRow[]
}

export function validateStepUpSIP(
  inputs: StepUpSIPInputs
): Array<{ field: keyof StepUpSIPInputs; message: string }> {
  const errors: Array<{ field: keyof StepUpSIPInputs; message: string }> = []

  if (isNaN(inputs.monthlyInvestment) || inputs.monthlyInvestment <= 0)
    errors.push({ field: 'monthlyInvestment', message: 'Must be greater than zero' })

  if (isNaN(inputs.annualStepUpPct) || inputs.annualStepUpPct < 0 || inputs.annualStepUpPct > 100)
    errors.push({ field: 'annualStepUpPct', message: 'Must be between 0 and 100' })

  if (isNaN(inputs.annualReturnPct) || inputs.annualReturnPct <= 0 || inputs.annualReturnPct > 100)
    errors.push({ field: 'annualReturnPct', message: 'Must be between 0.01 and 100' })

  if (isNaN(inputs.tenureYears) || inputs.tenureYears <= 0 || inputs.tenureYears > 50 || !Number.isInteger(inputs.tenureYears))
    errors.push({ field: 'tenureYears', message: 'Must be a whole number between 1 and 50' })

  return errors
}

export function calcStepUpSIP(inputs: StepUpSIPInputs): StepUpSIPResult {
  const { monthlyInvestment, annualStepUpPct, annualReturnPct, tenureYears } = inputs
  const monthlyRate = annualReturnPct / 12 / 100
  const totalMonths = tenureYears * 12

  let totalInvested   = 0
  let estimatedWealth = 0

  const yearlyBreakdown: StepUpSIPYearRow[] = []
  let cumulativeInvested = 0

  for (let year = 0; year < tenureYears; year++) {
    const monthlyContrib = monthlyInvestment * Math.pow(1 + annualStepUpPct / 100, year)
    const yearlyContrib  = monthlyContrib * 12
    cumulativeInvested  += yearlyContrib

    // Compound each month of this year to end of total tenure
    for (let m = 0; m < 12; m++) {
      const monthIndex       = year * 12 + m           // 0-based month number
      const monthsRemaining  = totalMonths - monthIndex // months this contribution grows
      estimatedWealth       += monthlyContrib * Math.pow(1 + monthlyRate, monthsRemaining)
    }

    yearlyBreakdown.push({
      year:            year + 1,
      monthlyContrib,
      yearlyContrib,
      totalInvested:   cumulativeInvested,
      projectedValue:  estimatedWealth,   // snapshot at end of this year (approximate)

      monthlyContribFmt:  currency(monthlyContrib),
      yearlyContribFmt:   currency(yearlyContrib),
      totalInvestedFmt:   currency(cumulativeInvested),
      projectedValueFmt:  currency(estimatedWealth),
    })
  }

  totalInvested = cumulativeInvested
  const wealthGained   = estimatedWealth - totalInvested
  const absoluteReturn = totalInvested > 0 ? (wealthGained / totalInvested) * 100 : 0
  const finalMonthlyContrib = monthlyInvestment * Math.pow(1 + annualStepUpPct / 100, tenureYears - 1)

  return {
    totalInvested,
    estimatedWealth,
    wealthGained,
    absoluteReturn,

    totalInvestedFmt:      currency(totalInvested),
    estimatedWealthFmt:    currency(estimatedWealth),
    wealthGainedFmt:       currency(wealthGained),
    absoluteReturnFmt:     pct(absoluteReturn, 1),
    monthlyInvestmentFmt:  currency(monthlyInvestment),
    finalMonthlyContribFmt: currency(finalMonthlyContrib),

    yearlyBreakdown,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Goal-Based Wealth Planner
//
// Find the fixed monthly SIP required to reach `targetWealth` in `years`,
// given an existing `currentSavings` that will also compound.
//
// Future value of current savings:
//   FV_savings = currentSavings × (1 + annualRate)^years
//
// The remaining amount must come from a monthly SIP:
//   FV_SIP = SIP × [(1 + r)^n − 1] / r × (1 + r)
//   (annuity-due formula — end-of-month payments)
//
// Solving for SIP:
//   SIP = (targetWealth − FV_savings) × r / [(1 + r)^n − 1] / (1 + r)
// ─────────────────────────────────────────────────────────────────────────────

export interface GoalPlannerInputs {
  /** Target corpus / wealth to accumulate */
  targetWealth: number
  /** Years to reach the target */
  timeHorizonYears: number
  /** Expected annual return in percent */
  annualReturnPct: number
  /** Amount already saved / invested (optional, can be 0) */
  currentSavings: number
}

export interface GoalPlannerResult {
  requiredMonthlySIP: number
  /** Future value of current savings alone */
  fvCurrentSavings: number
  /** Gap to be covered by SIP */
  sipTargetAmount: number
  totalSIPContribution: number
  totalWealth: number
  wealthGained: number

  requiredMonthlySIPFmt: string
  fvCurrentSavingsFmt: string
  sipTargetAmountFmt: string
  totalSIPContributionFmt: string
  totalWealthFmt: string
  wealthGainedFmt: string
  targetWealthFmt: string
  timeHorizonLabel: string
}

export function validateGoalPlanner(
  inputs: GoalPlannerInputs
): Array<{ field: keyof GoalPlannerInputs; message: string }> {
  const errors: Array<{ field: keyof GoalPlannerInputs; message: string }> = []

  if (isNaN(inputs.targetWealth) || inputs.targetWealth <= 0)
    errors.push({ field: 'targetWealth', message: 'Must be greater than zero' })

  if (isNaN(inputs.timeHorizonYears) || inputs.timeHorizonYears <= 0 || inputs.timeHorizonYears > 50 || !Number.isInteger(inputs.timeHorizonYears))
    errors.push({ field: 'timeHorizonYears', message: 'Must be a whole number between 1 and 50' })

  if (isNaN(inputs.annualReturnPct) || inputs.annualReturnPct <= 0 || inputs.annualReturnPct > 100)
    errors.push({ field: 'annualReturnPct', message: 'Must be between 0.01 and 100' })

  if (isNaN(inputs.currentSavings) || inputs.currentSavings < 0)
    errors.push({ field: 'currentSavings', message: 'Cannot be negative' })

  // Check if current savings alone already meet the target
  if (!errors.length) {
    const r = inputs.annualReturnPct / 100
    const fv = inputs.currentSavings * Math.pow(1 + r, inputs.timeHorizonYears)
    if (fv >= inputs.targetWealth) {
      errors.push({
        field: 'currentSavings',
        message: 'Current savings will already exceed your target — reduce savings or increase target.',
      })
    }
  }

  return errors
}

export function calcGoalPlanner(inputs: GoalPlannerInputs): GoalPlannerResult {
  const { targetWealth, timeHorizonYears, annualReturnPct, currentSavings } = inputs
  const n = timeHorizonYears * 12          // total months
  const r = annualReturnPct / 12 / 100     // monthly rate

  // Future value of current savings (annual compounding approximation)
  const fvCurrentSavings = currentSavings * Math.pow(1 + annualReturnPct / 100, timeHorizonYears)

  // Gap the SIP must cover
  const sipTargetAmount = Math.max(0, targetWealth - fvCurrentSavings)

  // Required monthly SIP (end-of-period ordinary annuity)
  let requiredMonthlySIP: number
  if (r === 0) {
    requiredMonthlySIP = sipTargetAmount / n
  } else {
    const factor = Math.pow(1 + r, n)
    requiredMonthlySIP = sipTargetAmount * r / (factor - 1)
  }

  const totalSIPContribution = requiredMonthlySIP * n
  const totalWealth          = fvCurrentSavings + sipTargetAmount   // ≈ targetWealth
  const wealthGained         = totalWealth - totalSIPContribution - currentSavings

  const yrs = timeHorizonYears
  const timeHorizonLabel = `${yrs} year${yrs !== 1 ? 's' : ''}`

  return {
    requiredMonthlySIP,
    fvCurrentSavings,
    sipTargetAmount,
    totalSIPContribution,
    totalWealth,
    wealthGained,

    requiredMonthlySIPFmt:  currency(requiredMonthlySIP),
    fvCurrentSavingsFmt:    currency(fvCurrentSavings),
    sipTargetAmountFmt:     currency(sipTargetAmount),
    totalSIPContributionFmt: currency(totalSIPContribution),
    totalWealthFmt:         currency(totalWealth),
    wealthGainedFmt:        currency(wealthGained),
    targetWealthFmt:        currency(targetWealth),
    timeHorizonLabel,
  }
}

// suppress unused-import lint for fmtInt (reserved for future display needs)
void fmtInt
