import { describe, it, expect } from 'vitest'
import { calcLinesTotal, formatLinesSummary, normalizeLines } from './juiceUnits.js'

describe('juiceUnits', () => {
  it('calculates total from multiple sized lines', () => {
    const result = calcLinesTotal([
      { size: '350ml', quantity: 24, price_per_unit: 45 },
      { size: '500ml', quantity: 12, price_per_unit: 60 },
    ])
    expect(result.total).toBe(24 * 45 + 12 * 60)
    expect(result.totalQuantity).toBe(36)
    expect(result.lines).toHaveLength(2)
  })

  it('ignores incomplete lines', () => {
    const lines = normalizeLines([
      { size: '350ml', quantity: 10, price_per_unit: 40 },
      { size: '', quantity: 5, price_per_unit: 20 },
      { size: '1L', quantity: 0, price_per_unit: 100 },
    ])
    expect(lines).toHaveLength(1)
  })

  it('formats summary text', () => {
    expect(
      formatLinesSummary([{ size: '350ml', quantity: 24, price_per_unit: 45 }])
    ).toBe('24 × 350ml')
  })
})
