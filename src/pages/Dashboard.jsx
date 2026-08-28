import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Panel } from '../components/ui/Panel'
import { PageHeader } from '../components/ui/PageHeader'
import { DateRangeFilter } from '../components/ui/DateRangeFilter'
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart'
import { ExpenseBreakdown } from '../components/charts/ExpenseBreakdown'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useDateRange } from '../hooks/useDateRange'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, formatWeight, formatDate, CATEGORY_LABELS } from '../utils/formatters'
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  Trees,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

export function Dashboard() {
  const { profile, user, isOwner } = useAuth()
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisMonth')

  const firstName = (profile?.full_name || '').trim().split(' ')[0] || user?.email?.split('@')[0] || 'Farmer'

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

  const loading = (isOwner && incomeLoading) || expenseLoading || harvestLoading

  const totalIncome = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [incomeData]
  )

  const totalExpense = useMemo(
    () => expenseData.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenseData]
  )

  const netProfit = totalIncome - totalExpense
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : null

  const totalHarvestKg = useMemo(
    () => harvestData.reduce((sum, item) => sum + Number(item.kg_harvested || 0), 0),
    [harvestData]
  )

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

  const categoryChartData = useMemo(() => {
    const map = {}
    expenseData.forEach((exp) => {
      const cat = exp.category || 'other'
      map[cat] = (map[cat] || 0) + Number(exp.amount || 0)
    })
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  }, [expenseData])

  const blockBreakdown = useMemo(() => {
    const map = {}
    harvestData.forEach((h) => {
      const block = h.block_name || 'General'
      map[block] = (map[block] || 0) + Number(h.kg_harvested || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [harvestData])

  const recentTransactions = useMemo(() => {
    if (isOwner) {
      const inc = incomeData.map((i) => ({ ...i, txType: 'income' }))
      const exp = expenseData.map((e) => ({ ...e, txType: 'expense' }))
      return [...inc, ...exp]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6)
    }
    // Staff only sees expense logs
    return expenseData.map((e) => ({ ...e, txType: 'expense' })).slice(0, 6)
  }, [incomeData, expenseData, isOwner])

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={isOwner ? 'Executive Dashboard' : 'Field Operations Hub'}
        title={`Welcome back, ${firstName}`}
        description={
          isOwner
            ? 'Comprehensive summary of harvest yield, buyer revenue, operating costs, and profit.'
            : 'Track picking batches, orchard blocks, and field operational costs.'
        }
        actions={
          <DateRangeFilter
            preset={preset}
            setPreset={setPreset}
            customFrom={customFrom}
            setCustomFrom={setCustomFrom}
            customTo={customTo}
            setCustomTo={setCustomTo}
            presets={PRESETS}
          />
        }
      />

      {loading ? (
        <LoadingSpinner text="Computing orchard figures…" />
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Harvest Picked"
              value={formatWeight(totalHarvestKg)}
              subtitle={`${harvestData.length} picking batches`}
              icon={Trees}
              color="blue"
            />
            <Card
              title="Field Expenses"
              value={formatCurrency(totalExpense)}
              subtitle={`${expenseData.length} recorded items`}
              icon={Receipt}
              color="red"
            />
            {isOwner ? (
              <>
                <Card
                  title="Gross Revenue"
                  value={formatCurrency(totalIncome)}
                  subtitle={`${incomeData.length} buyer sales`}
                  icon={TrendingUp}
                  color="emerald"
                />
                <Card
                  title="Net Profit"
                  value={formatCurrency(netProfit)}
                  subtitle={
                    margin === null
                      ? 'No sales in period'
                      : `${margin >= 0 ? 'Operating Profit' : 'Operating Deficit'} · ${margin.toFixed(1)}%`
                  }
                  icon={PiggyBank}
                  color={netProfit >= 0 ? 'emerald' : 'amber'}
                />
              </>
            ) : (
              <>
                <Card
                  title="Top Plot"
                  value={blockBreakdown[0] ? blockBreakdown[0][0] : '—'}
                  subtitle={
                    blockBreakdown[0]
                      ? `${formatWeight(blockBreakdown[0][1])} harvested`
                      : 'No harvest data'
                  }
                  icon={TrendingUp}
                  color="emerald"
                />
                <Card
                  title="Average Batch"
                  value={
                    harvestData.length > 0
                      ? formatWeight(totalHarvestKg / harvestData.length)
                      : '0 kg'
                  }
                  subtitle="Average yield per picking"
                  icon={PiggyBank}
                  color="emerald"
                />
              </>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {isOwner ? (
              <>
                <Panel
                  className="lg:col-span-2"
                  title="Cash Flow & Operating Trends"
                  description="Monthly comparison between calamansi sales and farm upkeep"
                >
                  <IncomeExpenseChart data={monthlyChartData} />
                </Panel>
                <Panel title="Expense Allocation" description="Cost share by operational category">
                  <ExpenseBreakdown data={categoryChartData} />
                </Panel>
              </>
            ) : (
              <Panel
                className="lg:col-span-3"
                title="Expense Category Distribution"
                description="Share of costs logged for fertilizers, labor, irrigation, and maintenance"
              >
                <ExpenseBreakdown data={categoryChartData} />
              </Panel>
            )}
          </div>

          {/* Recent Activity & Quick Actions Row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Panel
              className="lg:col-span-2"
              title={isOwner ? 'Recent Farm Activity' : 'Recent Field Expenditures'}
              description={
                isOwner
                  ? 'Latest recorded income deliveries and field expenses'
                  : 'Latest operational expenses logged from the orchard'
              }
              action={
                isOwner ? (
                  <Link
                    to="/reports"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    <span>Full Ledger</span>
                    <ChevronRight size={13} />
                  </Link>
                ) : (
                  <Link
                    to="/expenses"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    <span>View All Expenses</span>
                    <ChevronRight size={13} />
                  </Link>
                )
              }
            >
              {recentTransactions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  No activity recorded for this period yet.
                </div>
              ) : (
                <div className="-mx-1 divide-y divide-white/5">
                  {recentTransactions.map((tx) => {
                    const isIncome = tx.txType === 'income'
                    return (
                      <div
                        key={`${tx.txType}-${tx.id}`}
                        className="group flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.025]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                              isIncome
                                ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25'
                                : 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/25'
                            }`}
                          >
                            {isIncome ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {isIncome ? tx.buyer : tx.description}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {formatDate(tx.date)} ·{' '}
                              {isIncome
                                ? `${tx.kg_sold} kg @ ₱${tx.price_per_kg}/kg`
                                : CATEGORY_LABELS[tx.category] || tx.category}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`shrink-0 font-display text-sm font-semibold tracking-tight ${
                            isIncome ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {isIncome ? '+' : '−'}
                          {formatCurrency(isIncome ? tx.total_amount : tx.amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>

            <Panel title="Field Actions" description="Fast data entry from the field">
              <div className="space-y-2.5">
                <Link
                  to="/harvests"
                  className="group flex items-center justify-between rounded-xl border border-white/8 bg-gradient-to-r from-sky-950/40 to-transparent p-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-sky-400/30 hover:bg-sky-500/10 hover:text-white hover:translate-x-0.5"
                >
                  <span className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-sky-500/20 p-1.5 text-sky-300 transition-transform group-hover:scale-110">
                      <Plus size={15} />
                    </div>
                    Record Harvest Batch
                  </span>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-sky-300" />
                </Link>

                <Link
                  to="/expenses"
                  className="group flex items-center justify-between rounded-xl border border-white/8 bg-gradient-to-r from-rose-950/40 to-transparent p-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-white hover:translate-x-0.5"
                >
                  <span className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-rose-500/20 p-1.5 text-rose-300 transition-transform group-hover:scale-110">
                      <Plus size={15} />
                    </div>
                    Log Field Expense
                  </span>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-rose-300" />
                </Link>

                {isOwner && (
                  <Link
                    to="/income"
                    className="group flex items-center justify-between rounded-xl border border-white/8 bg-gradient-to-r from-emerald-950/40 to-transparent p-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white hover:translate-x-0.5"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-300 transition-transform group-hover:scale-110">
                        <Plus size={15} />
                      </div>
                      Record Buyer Sale
                    </span>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-300" />
                  </Link>
                )}
              </div>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/6 bg-white/[0.02] p-3.5 text-xs leading-relaxed text-slate-400">
                <Sparkles size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                <p>
                  {isOwner
                    ? 'Tip: Record harvest picking batches first, then attach sales to track price per kilo.'
                    : 'Tip: Log tree batches right after picking, and attach receipt photos for any farm supplies bought.'}
                </p>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
