import { describe, it, expect } from 'vitest'
import {
  RED_BAG_KG,
  bagsToKg,
  kgToBags,
  splitHarvestKg,
  formatRedBagTotal,
  formatHarvestBreakdown,
  calcBagSale,
  calcKgSale,
  getHarvestSoldKg,
  getHarvestInventory,
  validateSaleInventory,
} from './farmUnits.js'

describe('farmUnits', () => {
  it('converts bags to kg at 27 kg per bag', () => {
    expect(bagsToKg(100)).toBe(2700)
    expect(kgToBags(2700)).toBe(100)
  })

  it('splits harvest totals into whole bags and loose kilos', () => {
    expect(splitHarvestKg(42)).toEqual({ wholeBags: 1, looseKg: 15, totalKg: 42 })
    expect(splitHarvestKg(15)).toEqual({ wholeBags: 0, looseKg: 15, totalKg: 15 })
    expect(splitHarvestKg(27)).toEqual({ wholeBags: 1, looseKg: 0, totalKg: 27 })
  })

  it('formats total harvest as equivalent red bags', () => {
    expect(formatRedBagTotal(42)).toBe('1.56 red bags')
    expect(formatRedBagTotal(15)).toBe('0.56 red bags')
    expect(formatRedBagTotal(27)).toBe('1.00 red bags')
  })

  it('formats harvest breakdown without misleading bag equivalents', () => {
    expect(formatHarvestBreakdown(42)).toBe('1 bag + 15 kg loose')
    expect(formatHarvestBreakdown(15)).toBe('15 kg loose')
    expect(formatHarvestBreakdown(27)).toBe('1 bag')
  })

  it('calculates bag sale income and derived kg pricing', () => {
    const sale = calcBagSale(50, 540)
    expect(sale.kgSold).toBe(1350)
    expect(sale.pricePerKg).toBe(20)
    expect(sale.income).toBe(27000)
  })

  it('calculates kilo sale income', () => {
    const sale = calcKgSale(1350, 20)
    expect(sale.equivalentBags).toBe(50)
    expect(sale.income).toBe(27000)
  })

  it('tracks sold kg for a harvest batch', () => {
    const sales = [
      { id: '1', harvest_id: 'h1', kg_sold: 540 },
      { id: '2', harvest_id: 'h1', kg_sold: 270 },
      { id: '3', harvest_id: 'h2', kg_sold: 100 },
    ]
    expect(getHarvestSoldKg(sales, 'h1')).toBe(810)
    expect(getHarvestSoldKg(sales, 'h1', '1')).toBe(270)
  })

  it('computes remaining inventory with pending sale kg', () => {
    const harvest = { id: 'h1', kg_harvested: 2700 }
    const sales = [{ id: '1', harvest_id: 'h1', kg_sold: 1350 }]
    const inventory = getHarvestInventory(harvest, sales, null, 1350)
    expect(inventory.remainingKg).toBe(0)
  })

  it('rejects overselling a harvest batch', () => {
    const harvest = { id: 'h1', kg_harvested: 2700 }
    const sales = [{ id: '1', harvest_id: 'h1', kg_sold: 2000 }]
    const inventory = getHarvestInventory(harvest, sales, null, 800)
    const result = validateSaleInventory({
      harvestId: 'h1',
      harvests: [harvest],
      inventory,
      requireBatch: true,
    })
    expect(result.ok).toBe(false)
  })

  it('requires a batch when harvests exist', () => {
    const result = validateSaleInventory({
      harvestId: '',
      harvests: [{ id: 'h1', kg_harvested: 100 }],
      inventory: null,
      requireBatch: true,
    })
    expect(result.ok).toBe(false)
  })

  it('uses consistent red bag constant', () => {
    expect(RED_BAG_KG).toBe(27)
  })
})
