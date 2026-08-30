export const RED_BAG_KG = 27

export function bagsToKg(bags) {
  return Number(bags || 0) * RED_BAG_KG
}

export function kgToBags(kg) {
  return Number(kg || 0) / RED_BAG_KG
}

export function formatBags(bags) {
  const value = Number(bags || 0)
  const formatted = value.toLocaleString('en-PH', { maximumFractionDigits: 1 })
  return `${formatted} ${Math.abs(value - 1) < 0.05 ? 'bag' : 'bags'}`
}

/** Income from whole red bags sold by the bag. */
export function calcBagSale(numRedBags, pricePerRedBag) {
  const bags = Number(numRedBags || 0)
  const pricePerBag = Number(pricePerRedBag || 0)
  return {
    bags,
    kgSold: bagsToKg(bags),
    pricePerKg: pricePerBag > 0 ? pricePerBag / RED_BAG_KG : 0,
    income: bags * pricePerBag,
  }
}

/**
 * Kilogram-based sale: remaining bags × 27 → kg; income = kg × price per kg.
 */
export function calcKgSale(kgSold, pricePerKg) {
  const kg = Number(kgSold || 0)
  const price = Number(pricePerKg || 0)
  return {
    kgSold: kg,
    equivalentBags: kgToBags(kg),
    income: kg * price,
  }
}

export function getHarvestSoldKg(linkedSales, harvestId, excludeSaleId = null) {
  if (!harvestId) return 0
  return linkedSales
    .filter((sale) => sale.harvest_id === harvestId && sale.id !== excludeSaleId)
    .reduce((sum, sale) => sum + Number(sale.kg_sold || 0), 0)
}

export function getHarvestInventory(harvest, linkedSales, excludeSaleId = null, pendingKg = 0) {
  const harvestKg = Number(harvest?.kg_harvested || 0)
  const harvestBags = kgToBags(harvestKg)
  const soldKg = getHarvestSoldKg(linkedSales, harvest?.id, excludeSaleId)
  const soldBags = kgToBags(soldKg)
  const remainingKg = harvestKg - soldKg - pendingKg
  const remainingBags = kgToBags(remainingKg)

  return { harvestKg, harvestBags, soldKg, soldBags, remainingKg, remainingBags }
}

export function validateSaleInventory({ harvestId, harvests = [], inventory, requireBatch = false }) {
  if (requireBatch && harvests.length > 0 && !harvestId) {
    return { ok: false, message: 'Select a harvest batch for this sale.' }
  }

  if (harvestId && inventory && inventory.remainingKg < -0.001) {
    const availableKg = Math.max(inventory.harvestKg - inventory.soldKg, 0)
    return {
      ok: false,
      message: `This sale exceeds remaining inventory (${availableKg.toFixed(1)} kg available).`,
    }
  }

  return { ok: true }
}
