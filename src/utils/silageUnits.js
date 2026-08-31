export function calcSilageSale({ numBags, pricePerBag, numCuttings, pricePerCutting }) {
  const bags = Number(numBags || 0)
  const cuttings = Number(numCuttings || 0)
  const bagIncome = bags * Number(pricePerBag || 0)
  const cuttingIncome = cuttings * Number(pricePerCutting || 0)

  return {
    bags,
    cuttings,
    bagIncome,
    cuttingIncome,
    totalIncome: bagIncome + cuttingIncome,
    hasBags: bags > 0,
    hasCuttings: cuttings > 0,
    isCombined: bags > 0 && cuttings > 0,
  }
}

export function formatSilageHarvestSummary(harvest) {
  const bags = Number(harvest?.num_bags || 0)
  const cuttings = Number(harvest?.num_cuttings || 0)
  const parts = []
  if (bags > 0) parts.push(`${bags} bag${bags === 1 ? '' : 's'}`)
  if (cuttings > 0) parts.push(`${cuttings} cutting${cuttings === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(' + ') : '—'
}

export function formatSilageSaleSummary(sale) {
  const saleCalc = calcSilageSale({
    numBags: sale?.num_bags,
    pricePerBag: sale?.price_per_bag,
    numCuttings: sale?.num_cuttings,
    pricePerCutting: sale?.price_per_cutting,
  })
  const parts = []
  if (saleCalc.hasBags) parts.push(`${saleCalc.bags} bag${saleCalc.bags === 1 ? '' : 's'}`)
  if (saleCalc.hasCuttings) parts.push(`${saleCalc.cuttings} cutting${saleCalc.cuttings === 1 ? '' : 's'}`)
  return parts.join(' + ') || '—'
}
