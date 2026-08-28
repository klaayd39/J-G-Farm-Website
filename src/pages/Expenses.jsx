import { useState, useMemo } from 'react'
import { Plus, Download, Edit2, Trash2, Receipt, Image as ImageIcon } from 'lucide-react'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ExpenseForm } from '../components/forms/ExpenseForm'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { supabase } from '../lib/supabase'
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

  const { data: rawExpenseData, loading, refetch } = useSupabaseQuery('expenses', {
    orderBy: 'date',
    ascending: false,
  })

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      toast.success('Expense deleted!')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense.')
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
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${color}20`, color: color }}
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
          {row.notes && <p className="text-xs text-slate-400 truncate max-w-xs">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => <span className="font-bold text-red-400">{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Receipt',
      cell: (row) =>
        row.receipt_url ? (
          <a
            href={row.receipt_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-emerald-400 hover:bg-slate-700"
            title="View Receipt"
          >
            <ImageIcon size={14} />
            <span>View</span>
          </a>
        ) : (
          <span className="text-xs text-slate-600">None</span>
        ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setEditingItem(row)
              setModalOpen(true)
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Edit expense"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
            title="Delete expense"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Farm Expense Log
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track fertilizers, labor wages, equipment maintenance, and field operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {rawExpenseData.length > 0 && (
            <button
              type="button"
              onClick={() => exportExpensesCSV(expenseData)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingItem(null)
              setModalOpen(true)
            }}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Log Farm Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Total Summary */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-400">Filter Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <option key={catKey} value={catKey}>
                {catLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="text-right sm:text-left">
          <p className="text-xs text-slate-400">Total Filtered Expenses</p>
          <p className="text-lg font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* Table / Empty State */}
      {loading ? (
        <LoadingSpinner text="Loading farm expenses..." />
      ) : rawExpenseData.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Farm Expenses Recorded"
          description="Log costs like fertilizer bags, seasonal labor, or irrigation fuel to keep your profit margins accurate."
          action={
            <button
              type="button"
              onClick={() => {
                setEditingItem(null)
                setModalOpen(true)
              }}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
            >
              Log First Expense
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={expenseData}
          searchKeys={['description', 'category', 'notes', 'date']}
          searchPlaceholder="Search expense, category, notes..."
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Farm Expense' : 'Log Farm Expense'}
      >
        <ExpenseForm
          initialData={editingItem}
          onSuccess={() => {
            setModalOpen(false)
            refetch()
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
