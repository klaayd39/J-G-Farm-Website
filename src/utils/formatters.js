/**
 * Format a number as Philippine Peso currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
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
  irrigation: 'Irrigation',
  tools_equipment: 'Tools & Equipment',
  transport: 'Transport',
  land_rent: 'Land Rent',
  other: 'Other',
}

/**
 * Colors for each expense category (for charts and badges)
 */
export const CATEGORY_COLORS = {
  fertilizer: '#10b981',
  pesticides: '#f59e0b',
  labor: '#6366f1',
  irrigation: '#06b6d4',
  tools_equipment: '#8b5cf6',
  transport: '#ec4899',
  land_rent: '#f97316',
  other: '#6b7280',
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0]
}
