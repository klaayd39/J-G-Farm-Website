/**
 * Format a number as Philippine Peso currency
 */
export function formatCurrency(amount) {
  const value = Number(amount) || 0
  const formatted = new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))
  const sign = value < 0 ? '−' : ''
  return `${sign}₱${formatted}`
}

/**
 * Format a number with kg suffix
 */
export function formatWeight(kg) {
  return `${Number(kg || 0).toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg`
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Format a date string to a short format (for charts)
 */
export function formatMonthYear(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
  }).format(date)
}

/**
 * Human-readable expense category labels
 */
export const CATEGORY_LABELS = {
  fertilizer: 'Fertilizer',
  pesticides: 'Pesticides',
  labor: 'Labor',
  tools_equipment: 'Tools & Equipment',
  transport: 'Transport',
  gas: 'Gas',
  meal: 'Meal',
  other: 'Other',
}

/**
 * Colors for each expense category (for charts and badges)
 */
export const CATEGORY_COLORS = {
  fertilizer: '#d7ffe0',
  pesticides: '#f59e0b',
  labor: '#6366f1',
  tools_equipment: '#8b5cf6',
  transport: '#ec4899',
  gas: '#eab308',
  meal: '#14b8a6',
  other: '#6b7280',
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

/** Current local time as HH:MM for time inputs */
export function nowTimeHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Format TIME or HH:MM string for display */
export function formatTime(timeStr) {
  if (!timeStr) return ''
  const parts = String(timeStr).split(':')
  const hours = Number(parts[0])
  const minutes = Number(parts[1] || 0)
  if (Number.isNaN(hours)) return ''
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/** Format ISO timestamp for ledger display */
export function formatDateTime(isoStr) {
  if (!isoStr) return ''
  const date = new Date(isoStr)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatUserLabel(profile) {
  if (!profile) return 'Unknown'
  const name = profile.full_name?.trim()
  if (name) return name
  return profile.email?.split('@')[0] || 'Unknown'
}
