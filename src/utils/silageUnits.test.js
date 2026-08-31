import { describe, it, expect } from 'vitest'
import { calcSilageSale, formatSilageHarvestSummary, formatSilageSaleSummary } from './silageUnits.js'

describe('silageUnits', () => {
  it('calculates combined bag and cutting income', () => {
    const sale = calcSilageSale({
      numBags: 10,
      pricePerBag: 500,
      numCuttings: 5,
      pricePerCutting: 200,
    })
    expect(sale.totalIncome).toBe(6000)
    expect(sale.isCombined).toBe(true)
  })

  it('formats harvest summary', () => {
    expect(formatSilageHarvestSummary({ num_bags: 3, num_cuttings: 2 })).toBe('3 bags + 2 cuttings')
  })

  it('formats sale summary', () => {
    expect(
      formatSilageSaleSummary({
        num_bags: 1,
        price_per_bag: 100,
        num_cuttings: 0,
        price_per_cutting: 0,
      })
    ).toBe('1 bag')
  })
})
