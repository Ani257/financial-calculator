import { createHashRouter, RouterProvider, Outlet } from 'react-router-dom'
import BottomNav from './components/BottomNav/BottomNav'
import HomePage from './pages/Home/HomePage'
import BusinessPage from './pages/Business/BusinessPage'
import LoansPage from './pages/Loans/LoansPage'
import InvestmentsPage from './pages/Investments/InvestmentsPage'
import FavoritesPage from './pages/Favorites/FavoritesPage'
import RecentsPage from './pages/Recents/RecentsPage'
import BurnRateCalculator from './calculators/business/BurnRate'
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
          { index: true, element: <BusinessPage /> },
          { path: 'burn-rate', element: <BurnRateCalculator /> },
        ],
      },
      { path: 'loans', element: <LoansPage /> },
      { path: 'investments', element: <InvestmentsPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'recents', element: <RecentsPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
