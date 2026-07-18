import { createHashRouter, RouterProvider, Outlet } from 'react-router-dom'
import BottomNav from './components/BottomNav/BottomNav'
import HomePage from './pages/Home/HomePage'
import BusinessPage from './pages/Business/BusinessPage'
import LoansPage from './pages/Loans/LoansPage'
import InvestmentsPage from './pages/Investments/InvestmentsPage'
import FavoritesPage from './pages/Favorites/FavoritesPage'
import RecentsPage from './pages/Recents/RecentsPage'
// Business calculators
import BurnRateCalculator    from './calculators/business/BurnRate'
import BreakEvenCalculator   from './calculators/business/BreakEven'
import CashRunwayCalculator  from './calculators/business/CashRunway'
// Loans calculators
import EMICalculator               from './calculators/loans/EMI'
import AmortizationCalculator      from './calculators/loans/Amortization'
import DebtConsolidationCalculator from './calculators/loans/DebtConsolidation'
// Investments calculators
import StepUpSIPCalculator  from './calculators/investments/StepUpSIP'
import GoalPlannerCalculator from './calculators/investments/GoalPlanner'
import NormalSIPCalculator  from './calculators/investments/NormalSIP'
import FDCalculator         from './calculators/investments/FD'
import RDCalculator         from './calculators/investments/RD'
import CAGRCalculator       from './calculators/investments/CAGR'
import { useBootStores } from './hooks/useStores'
import styles from './App.module.css'

function AppLayout() {
  useBootStores()
  return (
    <div className={styles.appLayout}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'business',
        children: [
          { index: true,           element: <BusinessPage /> },
          { path: 'burn-rate',     element: <BurnRateCalculator /> },
          { path: 'break-even',    element: <BreakEvenCalculator /> },
          { path: 'cash-runway',   element: <CashRunwayCalculator /> },
        ],
      },
      {
        path: 'loans',
        children: [
          { index: true,                element: <LoansPage /> },
          { path: 'emi',                element: <EMICalculator /> },
          { path: 'amortization',       element: <AmortizationCalculator /> },
          { path: 'debt-consolidation', element: <DebtConsolidationCalculator /> },
        ],
      },
      {
        path: 'investments',
        children: [
          { index: true,            element: <InvestmentsPage /> },
          { path: 'step-up-sip',   element: <StepUpSIPCalculator /> },
          { path: 'goal-planner',  element: <GoalPlannerCalculator /> },
          { path: 'normal-sip',    element: <NormalSIPCalculator /> },
          { path: 'fd',            element: <FDCalculator /> },
          { path: 'rd',            element: <RDCalculator /> },
          { path: 'cagr',          element: <CAGRCalculator /> },
        ],
      },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'recents',   element: <RecentsPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
