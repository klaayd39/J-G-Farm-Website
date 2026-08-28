import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { DateRangeFilter } from '../components/ui/DateRangeFilter'
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart'
import { ExpenseBreakdown } from '../components/charts/ExpenseBreakdown'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useDateRange } from '../hooks/useDateRange'
import { formatCurrency, formatWeight, formatDate, CATEGORY_LABELS } from '../utils/formatters'
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  Trees,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react'

export function Dashboard() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisMonth')

  // Fetch data
  const { data: incomeData, loading: incomeLoading } = useSupabaseQuery('income', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  const { data: expenseData, loading: expenseLoading } = useSupabaseQuery('expenses', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  const { data: harvestData, loading: harvestLoading } = useSupabaseQuery('harvests', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  const loading = incomeLoading || expenseLoading || harvestLoading

  // Calculate totals
  const totalIncome = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [incomeData]
  )

  const totalExpense = useMemo(
    () => expenseData.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenseData]
  )

  const netProfit = totalIncome - totalExpense

  const totalHarvestKg = useMemo(
    () => harvestData.reduce((sum, item) => sum + Number(item.kg_harvested || 0), 0),
    [harvestData]
  )

  // Monthly aggregated chart data
  const monthlyChartData = useMemo(() => {
    const map = {}
    incomeData.forEach((inc) => {
      const month = inc.date ? inc.date.substring(0, 7) : 'Unknown'
      if (!map[month]) map[month] = { period: month, income: 0, expense: 0 }
      map[month].income += Number(inc.total_amount || 0)
    })

    expenseData.forEach((exp) => {
      const month = exp.date ? exp.date.substring(0, 7) : 'Unknown'
      if (!map[month]) map[month] = { period: month, income: 0, expense: 0 }
      map[month].expense += Number(exp.amount || 0)
    })

    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period))
  }, [incomeData, expenseData])

  // Category expense aggregated data
  const categoryChartData = useMemo(() => {
    const map = {}
    expenseData.forEach((exp) => {
      const cat = exp.category || 'other'
      map[cat] = (map[cat] || 0) + Number(exp.amount || 0)
    })
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [expenseData])

  // Combined recent transactions (last 6)
  const recentTransactions = useMemo(() => {
    const inc = incomeData.map((i) => ({ ...i, txType: 'income' }))
    const exp = expenseData.map((e) => ({ ...e, txType: 'expense' }))
    return [...inc, ...exp]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6)
  }, [incomeData, expenseData])

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Farm Overview
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time financial and yield performance for your calamansi orchard
          </p>
        </div>

        <DateRangeFilter
          preset={preset}
          setPreset={setPreset}
          customFrom={customFrom}
          setCustomFrom={setCustomFrom}
          customTo={customTo}
          setCustomTo={setCustomTo}
          presets={PRESETS}
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Calculating orchard metrics..." />
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              title="Total Income"
              value={formatCurrency(totalIncome)}
              subtitle={`${incomeData.length} sales recorded`}
              icon={TrendingUp}
              color="emerald"
            />
            <Card
              title="Total Expenses"
              value={formatCurrency(totalExpense)}
              subtitle={`${expenseData.length} expense items`}
              icon={Receipt}
              color="red"
            />
            <Card
              title="Net Profit"
              value={formatCurrency(netProfit)}
              subtitle={netProfit >= 0 ? 'Profitable period' : 'Net deficit'}
              icon={PiggyBank}
              color={netProfit >= 0 ? 'blue' : 'amber'}
            />
            <Card
              title="Calamansi Harvested"
              value={formatWeight(totalHarvestKg)}
              subtitle={`${harvestData.length} harvest logs`}
              icon={Trees}
              color="emerald"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Income vs Expenses Chart */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Cash Flow Comparison</h3>
                  <p className="text-xs text-slate-400">Monthly breakdown of income vs expenses</p>
                </div>
              </div>
              <IncomeExpenseChart data={monthlyChartData} />
            </div>

            {/* Expense Breakdown Donut */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
              <div className="mb-4">
                <h3 className="text-base font-bold text-white">Expense Breakdown</h3>
                <p className="text-xs text-slate-400">Distribution by cost category</p>
              </div>
              <ExpenseBreakdown data={categoryChartData} />
            </div>
          </div>

          {/* Recent Activity Table & Quick Actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Transactions */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Recent Transactions</h3>
                  <p className="text-xs text-slate-400">Latest sales and expense items</p>
                </div>
                <Link
                  to="/reports"
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  View All &rarr;
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No transactions recorded for this period.
                </p>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {recentTransactions.map((tx) => {
                    const isIncome = tx.txType === 'income'
                    return (
                      <div
                        key={`${tx.txType}-${tx.id}`}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              isIncome
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {isIncome ? tx.buyer : tx.description}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatDate(tx.date)} &bull;{' '}
                              {isIncome
                                ? `${tx.kg_sold} kg @ ₱${tx.price_per_kg}/kg`
                                : CATEGORY_LABELS[tx.category] || tx.category}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-bold ${
                            isIncome ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(isIncome ? tx.total_amount : tx.amount)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
              <div>
                <h3 className="text-base font-bold text-white">Quick Farm Actions</h3>
                <p className="text-xs text-slate-400">Add logs straight from the field</p>

                <div className="mt-4 space-y-2.5">
                  <Link
                    to="/income"
                    className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <Plus size={16} />
                      <span>Log Calamansi Sale</span>
                    </div>
                    <span className="text-xs text-emerald-400">&rarr;</span>
                  </Link>

                  <Link
                    to="/expenses"
                    className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <Plus size={16} />
                      <span>Log Farm Expense</span>
                    </div>
                    <span className="text-xs text-red-400">&rarr;</span>
                  </Link>

                  <Link
                    to="/harvests"
                    className="flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-sm font-semibold text-blue-300 transition-all hover:bg-blue-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <Plus size={16} />
                      <span>Record Harvest Batch</span>
                    </div>
                    <span className="text-xs text-blue-400">&rarr;</span>
                  </Link>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-950/60 p-3.5 border border-slate-800 text-xs text-slate-400">
                💡 <span className="font-semibold text-slate-300">Tip:</span> Track daily pickings
                under Harvests, then link sales to batches to accurately analyze your profit per
                kilogram.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
