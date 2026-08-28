import { useState, useMemo } from 'react'
import { startOfMonth, endOfMonth, subDays, startOfYear, endOfYear, format } from 'date-fns'

const PRESETS = {
  thisMonth: 'This Month',
  last30: 'Last 30 Days',
  thisYear: 'This Year',
  allTime: 'All Time',
  custom: 'Custom Range',
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

export function useDateRange(initialPreset = 'thisMonth') {
  const [preset, setPreset] = useState(initialPreset)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const range = useMemo(() => {
    if (preset === 'custom') {
      return { from: customFrom, to: customTo }
    }
    return getPresetRange(preset)
  }, [preset, customFrom, customTo])

  const filters = useMemo(() => {
    const f = []
    if (range.from) f.push({ column: 'date', operator: 'gte', value: range.from })
    if (range.to) f.push({ column: 'date', operator: 'lte', value: range.to })
    return f
  }, [range])

  return {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    range,
    filters,
    PRESETS,
  }
}
