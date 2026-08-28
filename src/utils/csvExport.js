import { formatDate, formatCurrency, formatWeight, CATEGORY_LABELS } from './formatters'

/**
 * Convert an array of objects to a CSV string
 */
function toCSV(data, columns) {
  const header = columns.map((c) => c.label).join(',')
  const rows = data.map((row) =>
    columns
      .map((c) => {
        let val = c.accessor(row)
        if (val === null || val === undefined) val = ''
        // Escape quotes and wrap in quotes if contains comma or quote
        val = String(val)
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`
        }
        return val
      })
      .join(',')
  )
  return [header, ...rows].join('\n')
}

/**
 * Download a CSV string as a file
 */
function downloadCSV(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export income data to CSV
 */
export function exportIncomeCSV(data) {
  const columns = [
    { label: 'Date', accessor: (r) => formatDate(r.date) },
    { label: 'Buyer/Market', accessor: (r) => r.buyer },
    { label: 'Kg Sold', accessor: (r) => r.kg_sold },
    { label: 'Price per Kg (₱)', accessor: (r) => r.price_per_kg },
    { label: 'Total Amount (₱)', accessor: (r) => r.total_amount },
    { label: 'Notes', accessor: (r) => r.notes },
  ]
  downloadCSV(toCSV(data, columns), `jg-farm-income-${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export expenses data to CSV
 */
export function exportExpensesCSV(data) {
  const columns = [
    { label: 'Date', accessor: (r) => formatDate(r.date) },
    { label: 'Category', accessor: (r) => CATEGORY_LABELS[r.category] || r.category },
    { label: 'Description', accessor: (r) => r.description },
    { label: 'Amount (₱)', accessor: (r) => r.amount },
    { label: 'Notes', accessor: (r) => r.notes },
  ]
  downloadCSV(toCSV(data, columns), `jg-farm-expenses-${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export harvests data to CSV
 */
export function exportHarvestsCSV(data) {
  const columns = [
    { label: 'Date', accessor: (r) => formatDate(r.date) },
    { label: 'Block/Area', accessor: (r) => r.block_name },
    { label: 'Kg Harvested', accessor: (r) => r.kg_harvested },
    { label: 'Notes', accessor: (r) => r.notes },
  ]
  downloadCSV(toCSV(data, columns), `jg-farm-harvests-${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export combined report to CSV
 */
export function exportReportCSV(income, expenses) {
  const incomeRows = income.map((r) => ({
    type: 'Income',
    date: formatDate(r.date),
    description: r.buyer || 'Sale',
    category: '-',
    amount: r.total_amount,
    details: `${r.kg_sold} kg × ₱${r.price_per_kg}/kg`,
  }))
  const expenseRows = expenses.map((r) => ({
    type: 'Expense',
    date: formatDate(r.date),
    description: r.description,
    category: CATEGORY_LABELS[r.category] || r.category,
    amount: -r.amount,
    details: r.notes || '',
  }))

  const all = [...incomeRows, ...expenseRows]

  const columns = [
    { label: 'Type', accessor: (r) => r.type },
    { label: 'Date', accessor: (r) => r.date },
    { label: 'Description', accessor: (r) => r.description },
    { label: 'Category', accessor: (r) => r.category },
    { label: 'Amount (₱)', accessor: (r) => r.amount },
    { label: 'Details', accessor: (r) => r.details },
  ]
  downloadCSV(toCSV(all, columns), `jg-farm-report-${new Date().toISOString().split('T')[0]}.csv`)
}
