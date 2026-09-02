export function emptyLine() {
  return { size: '', quantity: '', price_per_unit: '' }
}

export function linesFromRecord(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return [emptyLine()]
  }
  return lines.map((line) => ({
    size: line.size ?? '',
    quantity: line.quantity != null ? String(line.quantity) : '',
    price_per_unit: line.price_per_unit != null ? String(line.price_per_unit) : '',
  }))
}

export function normalizeLines(rawLines) {
  return (rawLines || [])
    .map((line) => ({
      size: String(line.size || '').trim(),
      quantity: Number(line.quantity || 0),
      price_per_unit: Number(line.price_per_unit || 0),
    }))
    .filter((line) => line.size && line.quantity > 0 && line.price_per_unit > 0)
}

export function calcLinesTotal(rawLines) {
  const lines = normalizeLines(rawLines).map((line) => ({
    ...line,
    subtotal: line.quantity * line.price_per_unit,
  }))

  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.subtotal, 0),
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
  }
}

export function formatLinesSummary(rawLines) {
  const { lines } = calcLinesTotal(rawLines)
  if (lines.length === 0) return '—'
  return lines.map((line) => `${line.quantity} × ${line.size}`).join(', ')
}

export function formatLinePrices(rawLines) {
  const { lines } = calcLinesTotal(rawLines)
  if (lines.length === 0) return '—'
  return lines.map((line) => `${line.size} @ ${line.price_per_unit}`).join(', ')
}
