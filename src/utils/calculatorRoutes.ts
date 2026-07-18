/**
 * Maps every calculatorId (as stored in favorites / recents) to its hash-router path.
 * Used by FavoritesPage and RecentsPage to navigate back into a calculator
 * with pre-filled inputs via React Router location state.
 */
export const CALCULATOR_ROUTES: Record<string, string> = {
  'burn-rate':          '/business/burn-rate',
  'break-even':         '/business/break-even',
  'cash-runway':        '/business/cash-runway',
  'emi':                '/loans/emi',
  'amortization':       '/loans/amortization',
  'debt-consolidation': '/loans/debt-consolidation',
  'step-up-sip':        '/investments/step-up-sip',
  'goal-planner':       '/investments/goal-planner',
  'normal-sip':          '/investments/normal-sip',
  'fd':                  '/investments/fd',
  'rd':                  '/investments/rd',
  'cagr':                '/investments/cagr',
  'swp':                 '/investments/swp',
  'retirement-planner':  '/investments/retirement-planner',
}
