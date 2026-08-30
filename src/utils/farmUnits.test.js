import { describe, it, expect } from 'vitest'
import {
  RED_BAG_KG,
  bagsToKg,
  kgToBags,
  calcRedBagEquivalent,
  formatRedBagEquivalent,
  formatRedBagTotal,
  formatHarvestBreakdown,
  splitHarvestKg,
  kgFromHarvestParts,
  getHarvestParts,
  getHarvestKg,
  formatHarvestRedBags,
  wholeBagsFromKg,
  calcBagSale,
  calcKgSale,
  getHarvestSoldKg,
  getHarvestInventory,
  validateSaleInventory,
  getLooseKgAvailable,
  calcCombinedSale,
  getLooseKgAvailableAfterPendingBags,
} from './farmUnits.js'

describe('farmUnits', () => {
  it('converts bags to kg at 27 kg per bag', () => {
    expect(bagsToKg(100)).toBe(2700)
    expect(kgToBags(2700)).toBe(100)
  })

  it('calculates red bag equivalent from whole bags + loose kg', () => {
    expect(calcRedBagEquivalent(1, 15)).toBeCloseTo(1.555555, 5)
    expect(formatRedBagEquivalent(1, 15)).toBe('1.56 red bags')
    expect(formatRedBagEquivalent(0, 15)).toBe('0.56 red bags')
    expect(formatRedBagEquivalent(1, 0)).toBe('1.00 red bags')
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
    expect(formatRedBagTotal(0)).toBe('0.00 red bags')
  })

  it('formats harvest breakdown with explicit formula', () => {
    expect(formatHarvestBreakdown({ num_red_bags: 1, loose_kg: 15, kg_harvested: 42 })).toBe(
      '1 bag + 15 kg = 1.56 red bags'
    )
    expect(formatHarvestBreakdown(15)).toBe('15 kg = 0.56 red bags')
  })

  it('prefers stored harvest parts over split totals', () => {
    expect(getHarvestParts({ num_red_bags: 1, loose_kg: 15, kg_harvested: 42 })).toEqual({
      wholeBags: 1,
      looseKg: 15,
    })
    expect(kgFromHarvestParts(1, 15)).toBe(42)
  })

  it('ignores stored parts that disagree with kg_harvested', () => {
    expect(getHarvestParts({ num_red_bags: 0, loose_kg: 15, kg_harvested: 42 })).toEqual({
      wholeBags: 1,
      looseKg: 15,
    })
    expect(formatHarvestRedBags({ num_red_bags: 0, loose_kg: 15, kg_harvested: 42 })).toBe('1.56 red bags')
    expect(getHarvestKg({ num_red_bags: 0, loose_kg: 15, kg_harvested: 42 })).toBe(42)
  })

  it('counts whole bags available from remaining kg', () => {
    expect(wholeBagsFromKg(42)).toBe(1)
    expect(wholeBagsFromKg(15)).toBe(0)
    expect(wholeBagsFromKg(27)).toBe(1)
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
    const harvest = { id: 'h1', num_red_bags: 1, loose_kg: 15, kg_harvested: 42 }
    const sales = [{ id: '1', harvest_id: 'h1', kg_sold: 27 }]
    const inventory = getHarvestInventory(harvest, sales, null, 15)
    expect(inventory.remainingKg).toBe(0)
    expect(inventory.harvestKg).toBe(42)
  })

  it('limits loose kg sales when whole bags remain', () => {
    const harvest = { id: 'h1', kg_harvested: 42 }
    const inventory = getHarvestInventory(harvest, [], null, 0)
    expect(getLooseKgAvailable(inventory)).toBe(15)
    expect(inventory.maxWholeBags).toBe(1)

    expect(
      validateSaleInventory({
        harvestId: 'h1',
        harvests: [harvest],
        inventory,
        pendingKg: 15,
        saleMode: 'kg',
      }).ok
    ).toBe(true)

    expect(
      validateSaleInventory({
        harvestId: 'h1',
        harvests: [harvest],
        inventory,
        pendingKg: 20,
        saleMode: 'kg',
      }).ok
    ).toBe(false)
  })

  it('supports combined bag and loose sales on one save', () => {
    const harvest = { id: 'h1', kg_harvested: 42 }
    const inventory = getHarvestInventory(harvest, [], null, 0)
    const combined = calcCombinedSale({
      numRedBags: 1,
      pricePerRedBag: 500,
      looseKg: 15,
      pricePerKg: 30,
    })

    expect(combined.totalKgSold).toBe(42)
    expect(combined.totalIncome).toBe(950)
    expect(combined.isCombined).toBe(true)
    expect(getLooseKgAvailableAfterPendingBags(inventory, combined.bag.kgSold)).toBe(15)

    const preview = getHarvestInventory(harvest, [], null, combined.totalKgSold)
    expect(preview.remainingKg).toBe(0)

    expect(
      validateSaleInventory({
        harvestId: 'h1',
        harvests: [harvest],
        inventory,
        pendingKg: combined.totalKgSold,
        pendingBagKg: combined.bag.kgSold,
        pendingLooseKg: combined.kg.kgSold,
        saleMode: 'combined',
      }).ok
    ).toBe(true)
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
