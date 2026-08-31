import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { CATEGORY_COLORS, CATEGORY_LABELS, formatCurrency } from '../../utils/formatters'

function ExpenseBreakdownTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    return (
      <div className="rounded-2xl border border-app bg-app-surface p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-[color-mix(in_oklab,var(--app-text)_4%,transparent)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-app-secondary">{item.name}</p>
        <p className="mt-1 text-base font-bold text-app-primary">{formatCurrency(item.value)}</p>
        <p className="text-xs font-medium text-emerald-500">{item.percentage}% of total expenses</p>
      </div>
    )
  }
  return null
}

export function ExpenseBreakdown({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-app bg-app-hover text-sm text-app-muted">
        No expense data available for the selected period.
      </div>
    )
  }

  const totalExpense = data.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const chartData = data.map((item) => ({
    name: CATEGORY_LABELS[item.category] || item.category,
    value: Number(item.amount),
    categoryKey: item.category,
    percentage: totalExpense > 0 ? ((Number(item.amount) / totalExpense) * 100).toFixed(1) : 0,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={58}
            outerRadius={84}
            paddingAngle={3}
            dataKey="value"
            stroke="rgba(8, 17, 14, 0.8)"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.categoryKey] || '#6b7280'}
              />
            ))}
          </Pie>
          <Tooltip content={ExpenseBreakdownTooltip} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
            formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
