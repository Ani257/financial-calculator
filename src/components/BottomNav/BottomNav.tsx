import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.css'

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const navItems = [
  { to: '/',          label: 'Home',      Icon: IconHome,  exact: true },
  { to: '/favorites', label: 'Favorites', Icon: IconStar,  exact: false },
  { to: '/recents',   label: 'Recents',   Icon: IconClock, exact: false },
]

export default function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {navItems.map(({ to, label, Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) =>
            [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
          }
          aria-label={label}
        >
          <span className={styles.icon}>
            <Icon />
          </span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
