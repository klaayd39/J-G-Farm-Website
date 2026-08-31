import { describe, it, expect } from 'vitest'
import { calcJuiceSale, formatJuiceCount, isCombinedJuiceSale } from './juiceUnits.js'

describe('juiceUnits', () => {
  it('calculates bag and cutting income', () => {
    const sale = calcJuiceSale({
      numBags: 10,
      pricePerBag: 500,
      numCuttings: 5,
      pricePerCutting: 50,
    })
    expect(sale.totalIncome).toBe(5250)
    expect(sale.isCombined).toBe(true)
  })

  it('formats counts with singular/plural', () => {
    expect(formatJuiceCount(1, 'bag', 'bags')).toBe('1 bag')
    expect(formatJuiceCount(3, 'cutting', 'cuttings')).toBe('3 cuttings')
  })

  it('detects combined sales', () => {
    expect(isCombinedJuiceSale({ num_bags: 2, num_cuttings: 1 })).toBe(true)
    expect(isCombinedJuiceSale({ num_bags: 2, num_cuttings: 0 })).toBe(false)
  })
})
