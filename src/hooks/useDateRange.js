import { useState, useMemo, useCallback } from 'react'
import { startOfMonth, endOfMonth, subDays, startOfYear, endOfYear, format } from 'date-fns'

const PRESETS = {
  thisMonth: 'This Month',
  last30: 'Last 30 Days',
  thisYear: 'This Year',
  allTime: 'All Time',
}

function getPresetRange(preset) {
  const today = new Date()
  switch (preset) {
    case 'thisMonth':
      return { from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') }
    case 'last30':
      return { from: format(subDays(today, 30), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }
    case 'thisYear':
      return { from: format(startOfYear(today), 'yyyy-MM-dd'), to: format(endOfYear(today), 'yyyy-MM-dd') }
    case 'allTime':
      return { from: '', to: '' }
    default:
      return { from: '', to: '' }
  }
}

function detectPreset(from, to) {
  for (const key of Object.keys(PRESETS)) {
    const presetRange = getPresetRange(key)
    if (presetRange.from === from && presetRange.to === to) return key
  }
  return null
}

export function useDateRange(initialPreset = 'thisMonth') {
  const initialRange = getPresetRange(initialPreset)
  const [dateFrom, setDateFrom] = useState(initialRange.from)
  const [dateTo, setDateTo] = useState(initialRange.to)

  const setPresetRange = useCallback((key) => {
    const range = getPresetRange(key)
    setDateFrom(range.from)
    setDateTo(range.to)
  }, [])

  const activePreset = useMemo(() => detectPreset(dateFrom, dateTo), [dateFrom, dateTo])
  const range = useMemo(() => ({ from: dateFrom, to: dateTo }), [dateFrom, dateTo])

  const filters = useMemo(() => {
    const f = []
    if (range.from) f.push({ column: 'date', operator: 'gte', value: range.from })
    if (range.to) f.push({ column: 'date', operator: 'lte', value: range.to })
    return f
  }, [range])

  return {
    preset: activePreset,
    setPreset: setPresetRange,
    customFrom: dateFrom,
    setCustomFrom: setDateFrom,
    customTo: dateTo,
    setCustomTo: setDateTo,
    range,
    filters,
    PRESETS,
  }
}
