export const RED_BAG_KG = 27

export function bagsToKg(bags) {
  return Number(bags || 0) * RED_BAG_KG
}

export function kgToBags(kg) {
  return Number(kg || 0) / RED_BAG_KG
}

/** whole bags + (loose kg / 27) — e.g. 1 bag + 15 kg = 1.56 red bags */
export function calcRedBagEquivalent(wholeBags, looseKg) {
  return Number(wholeBags || 0) + Number(looseKg || 0) / RED_BAG_KG
}

function formatBagCount(bags) {
  if (Math.abs(bags) < 0.001) return '0.00 red bags'
  const sign = bags < 0 ? '−' : ''
  const rounded = (Math.round(Math.abs(bags) * 100) / 100).toFixed(2)
  return `${sign}${rounded} red bags`
}

export function formatRedBagEquivalent(wholeBags, looseKg) {
  return formatBagCount(calcRedBagEquivalent(wholeBags, looseKg))
}

export function formatBags(bags) {
  const value = Number(bags || 0)
  const formatted = value.toLocaleString('en-PH', { maximumFractionDigits: 1 })
  return `${formatted} ${Math.abs(value - 1) < 0.05 ? 'bag' : 'bags'}`
}

/** Format total kg as red bags using whole + loose split (consistent with harvest entry). */
export function formatRedBagTotal(totalKg) {
  const { wholeBags, looseKg } = splitHarvestKg(totalKg)
  return formatRedBagEquivalent(wholeBags, looseKg)
}

/** Whole red bags that can still be sold from remaining kg. */
export function wholeBagsFromKg(kg) {
  const value = Number(kg || 0)
  if (value <= 0) return 0
  return Math.floor(value / RED_BAG_KG + 1e-9)
}

/** Split stored total kg into whole red bags plus loose kilos. */
export function splitHarvestKg(totalKg) {
  const total = Number(totalKg || 0)
  if (total <= 0) return { wholeBags: 0, looseKg: 0, totalKg: 0 }

  const wholeBags = Math.floor(total / RED_BAG_KG + 1e-9)
  let looseKg = total - wholeBags * RED_BAG_KG
  looseKg = Math.abs(looseKg) < 0.001 ? 0 : Number(looseKg.toFixed(2))

  return { wholeBags, looseKg, totalKg: total }
}

export function kgFromHarvestParts(wholeBags, looseKg) {
  return Number((bagsToKg(wholeBags) + Number(looseKg || 0)).toFixed(2))
}

/** Prefer stored bag parts when they match kg_harvested; otherwise split from total kg. */
export function getHarvestParts(harvest) {
  const storedBags = Number(harvest?.num_red_bags ?? 0)
  const storedLoose = Number(harvest?.loose_kg ?? 0)
  const totalKg = Number(harvest?.kg_harvested ?? 0)
  const storedKg = kgFromHarvestParts(storedBags, storedLoose)
  const hasStoredParts =
    (storedBags > 0 || storedLoose > 0) &&
    totalKg > 0 &&
    Math.abs(storedKg - totalKg) < 0.01

  if (hasStoredParts) {
    return { wholeBags: storedBags, looseKg: storedLoose }
  }

  const { wholeBags, looseKg } = splitHarvestKg(totalKg)
  return { wholeBags, looseKg }
}

export function getHarvestKg(harvest) {
  const parts = getHarvestParts(harvest)
  return kgFromHarvestParts(parts.wholeBags, parts.looseKg)
}

export function formatHarvestRedBags(harvest) {
  const { wholeBags, looseKg } = getHarvestParts(harvest)
  return formatRedBagEquivalent(wholeBags, looseKg)
}

export function formatHarvestBreakdown(harvestOrKg) {
  const parts =
    typeof harvestOrKg === 'object' && harvestOrKg !== null
      ? getHarvestParts(harvestOrKg)
      : splitHarvestKg(harvestOrKg)

  const { wholeBags, looseKg } = parts
  const partsText = []

  if (wholeBags > 0) partsText.push(formatBags(wholeBags))
  if (looseKg > 0) {
    const looseLabel = Number.isInteger(looseKg)
      ? String(looseKg)
      : Number(looseKg).toLocaleString('en-PH', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
    partsText.push(`${looseLabel} kg`)
  }

  if (partsText.length === 0) return '—'
  return `${partsText.join(' + ')} = ${formatRedBagEquivalent(wholeBags, looseKg)}`
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
  const parts = getHarvestParts(harvest)
  const harvestKg = getHarvestKg(harvest)
  const soldKg = getHarvestSoldKg(linkedSales, harvest?.id, excludeSaleId)
  const remainingKg = Number((harvestKg - soldKg - pendingKg).toFixed(2))
  const availableKg = Number((harvestKg - soldKg).toFixed(2))

  return {
    harvestKg,
    harvestBags: calcRedBagEquivalent(parts.wholeBags, parts.looseKg),
    soldKg,
    soldBags: kgToBags(soldKg),
    remainingKg,
    remainingBags: kgToBags(remainingKg),
    availableKg,
    maxWholeBags: wholeBagsFromKg(availableKg),
    harvestParts: parts,
  }
}

/** Leftover kilos if every remaining whole bag is sold. */
export function getLooseKgAvailable(inventory) {
  if (!inventory) return 0
  const wholeKg = inventory.maxWholeBags * RED_BAG_KG
  return Number(Math.max(inventory.availableKg - wholeKg, 0).toFixed(2))
}

/** Kilos still sellable after bags entered on this form. */
export function getLooseKgAvailableAfterPendingBags(inventory, pendingBagKg = 0) {
  if (!inventory) return 0
  return Number(Math.max(inventory.availableKg - Number(pendingBagKg || 0), 0).toFixed(2))
}

export function calcCombinedSale({ numRedBags, pricePerRedBag, looseKg, pricePerKg }) {
  const bag = calcBagSale(numRedBags, pricePerRedBag)
  const kg = calcKgSale(looseKg, pricePerKg)
  return {
    bag,
    kg,
    totalKgSold: Number((bag.kgSold + kg.kgSold).toFixed(2)),
    totalIncome: bag.income + kg.income,
    hasBags: bag.bags > 0,
    hasLoose: kg.kgSold > 0,
    isCombined: bag.bags > 0 && kg.kgSold > 0,
  }
}

export function isCombinedIncomeSale(sale) {
  return Number(sale?.num_red_bags || 0) > 0 && Number(sale?.loose_kg_sold || 0) > 0
}

export function validateSaleInventory({
  harvestId,
  harvests = [],
  requireBatch = false,
}) {
  if (requireBatch && harvests.length > 0 && !harvestId) {
    return { ok: false, message: 'Select a harvest batch for this sale.' }
  }

  return { ok: true }
}
