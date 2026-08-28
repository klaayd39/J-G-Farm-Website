import { useMemo } from 'react'
import { Download, FileBarChart, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { DateRangeFilter } from '../components/ui/DateRangeFilter'
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart'
import { ExpenseBreakdown } from '../components/charts/ExpenseBreakdown'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { DataTable } from '../components/ui/DataTable'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useDateRange } from '../hooks/useDateRange'
import {
  formatCurrency,
  formatWeight,
  formatDate,
  CATEGORY_LABELS,
} from '../utils/formatters'
import { exportReportCSV } from '../utils/csvExport'

export function Reports() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

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

  const loading = incomeLoading || expenseLoading

  const totalIncome = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [incomeData]
  )

  const totalExpense = useMemo(
    () => expenseData.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenseData]
  )

  const netProfit = totalIncome - totalExpense

  const totalKgSold = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.kg_sold || 0), 0),
    [incomeData]
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

  // Unified ledger list
  const combinedTransactions = useMemo(() => {
    const inc = incomeData.map((i) => ({
      id: `inc-${i.id}`,
      type: 'Income',
      date: i.date,
      title: i.buyer,
      subtitle: `${i.kg_sold} kg @ ₱${i.price_per_kg}/kg`,
      category: 'Calamansi Sale',
      amount: Number(i.total_amount),
      isPositive: true,
      notes: i.notes,
    }))
    const exp = expenseData.map((e) => ({
      id: `exp-${e.id}`,
      type: 'Expense',
      date: e.date,
      title: e.description,
      subtitle: e.notes || '',
      category: CATEGORY_LABELS[e.category] || e.category,
      amount: Number(e.amount),
      isPositive: false,
      notes: e.notes,
    }))

    return [...inc, ...exp].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [incomeData, expenseData])

  const columns = [
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${
            row.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {row.isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {row.type}
        </span>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-white">{formatDate(row.date)}</span>,
    },
    {
      header: 'Description',
      accessorKey: 'title',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-white">{row.title}</p>
          {row.subtitle && <p className="text-xs text-slate-400">{row.subtitle}</p>}
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => <span className="text-xs text-slate-300">{row.category}</span>,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => (
        <span className={`font-bold ${row.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {row.isPositive ? '+' : '-'}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Financial & Harvest Reports
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Generate filtered P&L statements and export comprehensive CSV books
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            preset={preset}
            setPreset={setPreset}
            customFrom={customFrom}
            setCustomFrom={setCustomFrom}
            customTo={customTo}
            setCustomTo={setCustomTo}
            presets={PRESETS}
          />

          <button
            type="button"
            onClick={() => exportReportCSV(incomeData, expenseData)}
            disabled={combinedTransactions.length === 0}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Export Statement CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Generating financial statement..." />
      ) : (
        <>
          {/* Summary Banner */}
          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-slate-400">Period Income</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-400">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-[11px] text-slate-500">{formatWeight(totalKgSold)} sold</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Period Expenses</p>
              <p className="mt-1 text-2xl font-extrabold text-red-400">
                {formatCurrency(totalExpense)}
              </p>
              <p className="text-[11px] text-slate-500">{expenseData.length} expense entries</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Net Profit / Loss</p>
              <p
                className={`mt-1 text-2xl font-extrabold ${
                  netProfit >= 0 ? 'text-blue-400' : 'text-amber-400'
                }`}
              >
                {formatCurrency(netProfit)}
              </p>
              <p className="text-[11px] text-slate-500">
                {totalIncome > 0
                  ? `${((netProfit / totalIncome) * 100).toFixed(1)}% margin`
                  : 'No sales recorded'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Total Entries</p>
              <p className="mt-1 text-2xl font-extrabold text-white">
                {combinedTransactions.length}
              </p>
              <p className="text-[11px] text-slate-500">In current filter</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl lg:col-span-2">
              <h3 className="mb-4 text-base font-bold text-white">Period Cash Flow</h3>
              <IncomeExpenseChart data={monthlyChartData} />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
              <h3 className="mb-4 text-base font-bold text-white">Cost Distribution</h3>
              <ExpenseBreakdown data={categoryChartData} />
            </div>
          </div>

          {/* Unified Statement Table */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">Detailed Ledger Statement</h3>
            <DataTable
              columns={columns}
              data={combinedTransactions}
              searchKeys={['title', 'category', 'subtitle', 'date']}
              searchPlaceholder="Search statement ledger..."
            />
          </div>
        </>
      )}
    </div>
  )
}
