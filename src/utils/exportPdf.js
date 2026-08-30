import { formatCurrency, formatDate, formatWeight, CATEGORY_LABELS } from './formatters'
import { formatIncomeExportDetails } from './farmAnalytics'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function exportReportPDF({ incomeData, expenseData, title = 'J&G Farm P&L Statement' }) {
  const totalIncome = incomeData.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
  const totalExpense = expenseData.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const netProfit = totalIncome - totalExpense

  const rows = [
    ...incomeData.map((row) => ({
      type: 'Income',
      date: formatDate(row.date),
      description: row.buyer,
      details: formatIncomeExportDetails(row),
      amount: formatCurrency(row.total_amount),
    })),
    ...expenseData.map((row) => ({
      type: 'Expense',
      date: formatDate(row.date),
      description: row.description,
      details: CATEGORY_LABELS[row.category] || row.category,
      amount: formatCurrency(-row.amount),
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; padding: 32px; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 16px; color: #555; }
      .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
      .label { font-size: 12px; color: #666; text-transform: uppercase; }
      .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
      th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #555; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>Generated ${escapeHtml(new Date().toLocaleString('en-PH'))}</p>
    <div class="summary">
      <div class="card"><div class="label">Gross Income</div><div class="value">${escapeHtml(formatCurrency(totalIncome))}</div></div>
      <div class="card"><div class="label">Total Expenses</div><div class="value">${escapeHtml(formatCurrency(totalExpense))}</div></div>
      <div class="card"><div class="label">Net Profit</div><div class="value">${escapeHtml(formatCurrency(netProfit))}</div></div>
    </div>
    <table>
      <thead>
        <tr><th>Type</th><th>Date</th><th>Description</th><th>Details</th><th>Amount</th></tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) =>
              `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.description)}</td><td>${escapeHtml(row.details)}</td><td>${escapeHtml(row.amount)}</td></tr>`
          )
          .join('')}
      </tbody>
    </table>
  </body>
</html>`

  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) return
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
