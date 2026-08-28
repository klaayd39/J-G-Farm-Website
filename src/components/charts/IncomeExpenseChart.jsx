import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'

export function IncomeExpenseChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/6 bg-white/[0.02] text-sm text-slate-500">
        No transaction history available for the selected period.
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const income = payload.find((p) => p.dataKey === 'income')?.value || 0
      const expense = payload.find((p) => p.dataKey === 'expense')?.value || 0
      const profit = income - expense

      return (
        <div className="rounded-2xl border border-white/12 bg-[#0c1613]/95 p-3.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Income
              </span>
              <span className="font-semibold text-slate-100">{formatCurrency(income)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Expense
              </span>
              <span className="font-semibold text-slate-100">{formatCurrency(expense)}</span>
            </div>
            <div className="border-t border-white/8 pt-1.5 flex items-center justify-between gap-4 font-semibold">
              <span className="text-slate-400">Net Result</span>
              <span className={profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                {formatCurrency(profit)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#dc2626" stopOpacity={0.75} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
          <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: '#334155', opacity: 0.3 }} />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
            formatter={(value) => <span className="text-slate-300 capitalize font-medium">{value}</span>}
          />
          <Bar dataKey="income" name="Income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expense" name="Expense" fill="url(#expenseGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
