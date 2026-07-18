import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clipboard } from '@capacitor/clipboard'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { useFavorites, type FavoriteEntry } from '../../store/favorites'
import { useRecents, type RecentEntry } from '../../store/recents'
import Button from '../Button/Button'
import styles from './CalculatorShell.module.css'

// Icons as inline SVG components — zero library overhead
function IconChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconStar({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IconReset() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4" />
    </svg>
  )
}

interface CalculatorShellProps {
  /** Unique calculator identifier, e.g. "cash-runway" */
  calculatorId: string
  calculatorName: string
  description?: string
  /** The form inputs — rendered above the action bar */
  children: ReactNode
  /** Result rows for copy / export / favorites. Pass null when no result yet. */
  result: Array<{ label: string; value: string }> | null
  /** Current raw input values for saving to history */
  inputs: Record<string, string>
  /** Called when the user taps Reset */
  onReset: () => void
}

export default function CalculatorShell({
  calculatorId,
  calculatorName,
  description,
  children,
  result,
  inputs,
  onReset,
}: CalculatorShellProps) {
  const navigate = useNavigate()

  const addFavorite = useFavorites((s) => s.add)
  const removeFavorite = useFavorites((s) => s.remove)
  const isFavorite = useFavorites((s) => s.isFavorite)
  const pushRecent = useRecents((s) => s.push)

  const [toast, setToast] = useState<string | null>(null)

  const resultSummary = result ? result.map((r) => `${r.label}: ${r.value}`).join(' | ') : ''
  const favorited = result ? isFavorite(calculatorId, resultSummary) : false
  const favoriteItems = useFavorites((s) => s.items)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  async function handleCopy() {
    if (!result) return
    const text = result.map((r) => `${r.label}: ${r.value}`).join('\n')
    try {
      await Clipboard.write({ string: text })
      showToast('Copied to clipboard')
    } catch {
      try {
        await navigator.clipboard.writeText(text)
        showToast('Copied to clipboard')
      } catch {
        showToast('Copy not supported')
      }
    }
  }

  async function handleExport() {
    if (!result) return
    const date = new Date().toISOString().split('T')[0]
    const csvHeader = 'Label,Value'
    const csvRows = result.map((r) => `"${r.label}","${r.value}"`)
    const csv = [csvHeader, ...csvRows].join('\n')
    const fileName = `${calculatorId}-${date}.csv`

    try {
      await Filesystem.writeFile({
        path: fileName,
        data: csv,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })
      showToast(`Saved to Documents/${fileName}`)
    } catch {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      showToast('Exported')
    }
  }

  async function handleFavorite() {
    if (!result) return
    if (favorited) {
      const match = favoriteItems.find(
        (i) => i.calculatorId === calculatorId && i.result === resultSummary
      )
      if (match) await removeFavorite(match.id)
      showToast('Removed from favorites')
    } else {
      const entry: Omit<FavoriteEntry, 'id' | 'savedAt'> = {
        calculatorId,
        calculatorName,
        label: result[0]?.label ?? calculatorName,
        result: resultSummary,
        inputs,
      }
      await addFavorite(entry)

      const recentEntry: Omit<RecentEntry, 'id' | 'calculatedAt'> = {
        calculatorId,
        calculatorName,
        label: result[0]?.label ?? calculatorName,
        result: resultSummary,
        inputs,
      }
      await pushRecent(recentEntry)

      showToast('Added to favorites')
    }
  }

  return (
    <div className={styles.shell}>
      {/* Header */}
      <div className={styles.header}>
        {/* Back button */}
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <IconChevronLeft />
        </button>

        {/* Title + description */}
        <div className={styles.headerText}>
          <h1 className={styles.title}>{calculatorName}</h1>
          {description && <p className={styles.desc}>{description}</p>}
        </div>

        {/* Favorite toggle */}
        <button
          className={[styles.iconBtn, favorited ? styles.favorited : ''].filter(Boolean).join(' ')}
          onClick={handleFavorite}
          disabled={!result}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <IconStar filled={favorited} />
        </button>
      </div>

      {/* Calculator form content */}
      <div className={styles.content}>{children}</div>

      {/* Action bar */}
      <div className={styles.actionBar}>
        <Button variant="ghost" size="sm" onClick={onReset} aria-label="Reset">
          <IconReset />
          Reset
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!result} aria-label="Copy result">
          <IconCopy />
          Copy
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExport} disabled={!result} aria-label="Export CSV">
          <IconDownload />
          Export
        </Button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}
