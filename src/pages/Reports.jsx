import { useMemo } from 'react'
import { Download, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, PhilippinePeso, ListChecks, FileText } from 'lucide-react'
import { DateRangeFilter } from '../components/ui/DateRangeFilter'
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart'
import { ExpenseBreakdown } from '../components/charts/ExpenseBreakdown'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { DataTable } from '../components/ui/DataTable'
import { PageHeader } from '../components/ui/PageHeader'
import { PageToolbar } from '../components/ui/PageToolbar'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { QueryError } from '../components/ui/QueryError'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useDateRange } from '../hooks/useDateRange'
import { useQueryErrorToast } from '../hooks/useQueryErrorToast'
import {
  formatCurrency,
  formatWeight,
  formatDate,
  CATEGORY_LABELS,
} from '../utils/formatters'
import {
  buildMonthlyChartData,
  buildCategoryChartData,
  formatSaleSubtitle,
} from '../utils/farmAnalytics'
import { exportReportCSV } from '../utils/csvExport'
import { exportReportPDF } from '../utils/exportPdf'

export function Reports() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: incomeData, loading: incomeLoading, error: incomeError, refetch: refetchIncome } = useSupabaseQuery('income', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  const { data: expenseData, loading: expenseLoading, error: expenseError, refetch: refetchExpenses } = useSupabaseQuery('expenses', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  const queryError = incomeError || expenseError
  useQueryErrorToast(queryError)

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

  const monthlyChartData = useMemo(
    () => buildMonthlyChartData(incomeData, expenseData),
    [incomeData, expenseData]
  )

  const categoryChartData = useMemo(
    () => buildCategoryChartData(expenseData),
    [expenseData]
  )

  const combinedTransactions = useMemo(() => {
    const inc = incomeData.map((i) => ({
      id: `inc-${i.id}`,
      type: 'Income',
      date: i.date,
      title: i.buyer,
      subtitle: formatSaleSubtitle(i),
      category: 'Fruit Sale',
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
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${row.isPositive ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20' : 'bg-rose-500/10 text-rose-300 ring-rose-400/20'}`}>
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
      header: 'Description / Item',
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
      header: 'Classification',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => <span className="text-xs font-medium text-slate-300">{row.category}</span>,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => (
        <span className={`font-display font-semibold ${row.isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
          {row.isPositive ? '+' : '−'}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Financial Intelligence"
        title="Reports & Ledger"
        actions={
          <PageToolbar
            filter={<DateRangeFilter preset={preset} setPreset={setPreset} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} presets={PRESETS} />}
            actions={
              <>
                <Button variant="secondary" onClick={() => exportReportCSV(incomeData, expenseData)} disabled={combinedTransactions.length === 0}>
                  <Download size={15} />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button onClick={() => exportReportPDF({ incomeData, expenseData })} disabled={combinedTransactions.length === 0}>
                  <FileText size={15} />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </>
            }
          />
        }
      />

      {queryError && (
        <QueryError
          message={queryError}
          onRetry={() => {
            refetchIncome()
            refetchExpenses()
          }}
        />
      )}

      {loading ? (
        <LoadingSpinner text="Compiling financial statement…" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <div className="surface-panel rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-app-secondary">
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Gross Income</span>
                <TrendingUp size={18} className="text-emerald-400/80" />
              </div>
              <p className="mt-2 font-display text-xl sm:text-2xl font-semibold tabular-nums text-emerald-300">{formatCurrency(totalIncome)}</p>
              <p className="mt-1 text-xs text-app-secondary">{formatWeight(totalKgSold)} calamansi sold</p>
            </div>

            <div className="surface-panel rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-app-secondary">
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Total Expenses</span>
                <TrendingDown size={18} className="text-rose-400/80" />
              </div>
              <p className="mt-2 font-display text-xl sm:text-2xl font-semibold tabular-nums text-rose-300">{formatCurrency(totalExpense)}</p>
              <p className="mt-1 text-xs text-app-secondary">{expenseData.length} expense transactions</p>
            </div>

            <div className="surface-panel rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-app-secondary">
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Net Position</span>
                <PhilippinePeso size={18} className={netProfit >= 0 ? 'text-emerald-400/80' : 'text-amber-400/80'} />
              </div>
              <p className={`mt-2 font-display text-xl sm:text-2xl font-semibold tabular-nums ${netProfit >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {formatCurrency(netProfit)}
              </p>
              <p className="mt-1 text-xs text-app-secondary">
                {totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}% operating margin` : 'No income in period'}
              </p>
            </div>

            <div className="surface-panel rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-app-secondary">
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Statement Lines</span>
                <ListChecks size={18} className="text-sky-400/80" />
              </div>
              <p className="mt-2 font-display text-xl sm:text-2xl font-semibold tabular-nums text-app-primary">{combinedTransactions.length}</p>
              <p className="mt-1 text-xs text-app-secondary">Transactions within filter</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
            <Panel className="lg:col-span-2" title="Period Cash Flow" description="Monthly breakdown of revenue vs expenditure">
              <IncomeExpenseChart data={monthlyChartData} />
            </Panel>
            <Panel title="Expense Categories" description="Cost distribution breakdown">
              <ExpenseBreakdown data={categoryChartData} />
            </Panel>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-app-primary">Full Consolidated Ledger</h2>
              <p className="text-xs text-app-secondary">Unified chronology of farm sales and operational expenses</p>
            </div>
            <DataTable columns={columns} data={combinedTransactions} searchKeys={['title', 'category', 'subtitle', 'date']} searchPlaceholder="Search the ledger…" />
          </div>
        </>
      )}
    </div>
  )
}
