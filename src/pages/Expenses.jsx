import { useState, useMemo } from 'react'
import { Plus, Download, Pencil, Trash2, PhilippinePeso, Filter } from 'lucide-react'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { PageHeader } from '../components/ui/PageHeader'
import { PageToolbar } from '../components/ui/PageToolbar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ReceiptLink } from '../components/ui/ReceiptLink'
import { QueryError } from '../components/ui/QueryError'
import { DateRangeFilter } from '../components/ui/DateRangeFilter'
import { ExpenseForm } from '../components/forms/ExpenseForm'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useDateRange } from '../hooks/useDateRange'
import { useQueryErrorToast } from '../hooks/useQueryErrorToast'
import { supabase } from '../lib/supabase'
import { deleteReceipt } from '../utils/receiptStorage'
import {
  formatCurrency,
  formatDate,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '../utils/formatters'
import { exportExpensesCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

export function Expenses() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: rawExpenseData, loading, error, refetch } = useSupabaseQuery('expenses', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  useQueryErrorToast(error)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const expense = rawExpenseData.find((item) => item.id === deleteId)
      if (expense?.receipt_url) {
        try {
          await deleteReceipt(expense.receipt_url)
        } catch {
          // Continue deleting the expense even if storage cleanup fails.
        }
      }

      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', deleteId)
      if (deleteError) throw deleteError
      toast.success('Expense entry deleted')
      setDeleteId(null)
      refetch()
    } catch (err) {
      toast.error(err.message || 'Could not delete this expense.')
    } finally {
      setDeleting(false)
    }
  }

  const expenseData = useMemo(() => {
    if (selectedCategory === 'all') return rawExpenseData
    return rawExpenseData.filter((item) => item.category === selectedCategory)
  }, [rawExpenseData, selectedCategory])

  const totalExpenses = useMemo(
    () => expenseData.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenseData]
  )

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-white">{formatDate(row.date)}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (row) => {
        const color = CATEGORY_COLORS[row.category] || '#6b7280'
        return (
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset"
            style={{
              backgroundColor: `${color}18`,
              color,
              borderColor: `${color}30`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            {CATEGORY_LABELS[row.category] || row.category}
          </span>
        )
      },
    },
    {
      header: 'Description',
      accessorKey: 'description',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-white">{row.description}</p>
          {row.notes && <p className="max-w-xs truncate text-xs text-slate-400">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => <span className="font-semibold text-rose-300 font-display">{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Receipt',
      cell: (row) => <ReceiptLink receiptPath={row.receipt_url} />,
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setEditingItem(row)
              setModalOpen(true)
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteId(row.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Farm Expenditures"
        title="Field Expenses"
        actions={
          <PageToolbar
            filter={<DateRangeFilter preset={preset} setPreset={setPreset} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} presets={PRESETS} />}
            actions={
              <>
                {rawExpenseData.length > 0 && (
                  <Button variant="secondary" onClick={() => exportExpensesCSV(expenseData)}>
                    <Download size={15} />
                    <span className="hidden sm:inline">Export CSV</span>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setEditingItem(null)
                    setModalOpen(true)
                  }}
                >
                  <Plus size={16} />
                  Log Expense
                </Button>
              </>
            }
          />
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-gradient-to-b from-[#0a0a0a]/90 to-[#0a0a0a]/90 p-3.5 sm:p-4 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 overflow-x-auto pb-1 sm:pb-0 min-w-0">
          <div className="flex shrink-0 items-center gap-1 text-slate-400 pr-1">
            <Filter size={14} className="text-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Category</span>
          </div>
          <div className="flex flex-wrap gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Types
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`rounded-xl px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-all ${
                  selectedCategory === catKey
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {catLabel}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between sm:flex-col sm:items-end shrink-0 border-t border-white/6 pt-2.5 sm:border-0 sm:pt-0">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Category Total</p>
          <p className="font-display text-lg sm:text-xl font-semibold text-rose-300">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading expense entries…" />
      ) : rawExpenseData.length === 0 ? (
        <EmptyState
          icon={PhilippinePeso}
          title="No expenses logged yet"
          description="Log fertilizer, pesticide, or labor costs so profit and cost metrics stay accurate."
          action={
            <Button
              onClick={() => {
                setEditingItem(null)
                setModalOpen(true)
              }}
            >
              Log First Expense
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={expenseData}
          searchKeys={['description', 'category', 'notes', 'date']}
          searchPlaceholder="Search description or notes…"
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Expense Record' : 'Log New Expense'}
      >
        <ExpenseForm
          initialData={editingItem}
          defaultCategory={selectedCategory}
          onSuccess={() => {
            setModalOpen(false)
            refetch()
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this expense entry?"
        description="This action cannot be undone. The cost will be removed from financial totals."
        confirmLabel="Delete Expense"
      />
    </div>
  )
}
