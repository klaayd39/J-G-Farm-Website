export function calcJuiceSale({ numBags, pricePerBag, numCuttings, pricePerCutting }) {
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

export function formatJuiceCount(n, singular, plural) {
  const value = Number(n || 0)
  return `${value.toLocaleString('en-PH', { maximumFractionDigits: 1 })} ${Math.abs(value - 1) < 0.05 ? singular : plural}`
}

export function isCombinedJuiceSale(sale) {
  return Number(sale?.num_bags || 0) > 0 && Number(sale?.num_cuttings || 0) > 0
}

export function formatJuiceHarvestSummary(harvest) {
  const bags = Number(harvest?.num_bags || 0)
  const cuttings = Number(harvest?.num_cuttings || 0)
  const parts = []
  if (bags > 0) parts.push(formatJuiceCount(bags, 'bag', 'bags'))
  if (cuttings > 0) parts.push(formatJuiceCount(cuttings, 'cutting', 'cuttings'))
  return parts.length > 0 ? parts.join(' + ') : '—'
}
