import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, PhilippinePeso, Package } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageToolbar } from '../../components/ui/PageToolbar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { QueryError } from '../../components/ui/QueryError'
import { DateRangeFilter } from '../../components/ui/DateRangeFilter'
import { JuiceExpenseForm } from '../../components/forms/JuiceExpenseForm'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useDateRange } from '../../hooks/useDateRange'
import { useQueryErrorToast } from '../../hooks/useQueryErrorToast'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { calcLinesTotal, formatLinesSummary } from '../../utils/juiceUnits'
import toast from 'react-hot-toast'

export function JuiceExpenses() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: expenseData, loading, error, refetch } = useSupabaseQuery('juice_expenses', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  useQueryErrorToast(error)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('juice_expenses').delete().eq('id', deleteId)
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

  const totalExpenses = useMemo(
    () => expenseData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [expenseData]
  )

  const totalBoxes = useMemo(
    () =>
      expenseData.reduce((sum, item) => sum + calcLinesTotal(item.lines).totalQuantity, 0),
    [expenseData]
  )

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-app-primary">{formatDate(row.date)}</span>,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-app-primary">{row.description}</p>
          {row.notes && <p className="max-w-xs truncate text-xs text-app-secondary">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Boxes',
      accessorKey: 'lines',
      cell: (row) => (
        <div>
          <span className="font-medium text-app-primary">{formatLinesSummary(row.lines)}</span>
          <span className="block text-xs text-app-muted">
            {calcLinesTotal(row.lines).totalQuantity} box{calcLinesTotal(row.lines).totalQuantity === 1 ? '' : 'es'} total
          </span>
        </div>
      ),
    },
    {
      header: 'Prices',
      cell: (row) => {
        const { lines } = calcLinesTotal(row.lines)
        return (
          <div className="space-y-0.5 text-xs text-app-secondary">
            {lines.map((line) => (
              <div key={`${line.size}-${line.quantity}`}>
                {line.size}: {formatCurrency(line.price_per_unit)}/box
              </div>
            ))}
          </div>
        )
      },
    },
    {
      header: 'Total',
      accessorKey: 'total_amount',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (row) => <span className="font-medium tabular-nums text-rose-300">{formatCurrency(row.total_amount)}</span>,
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
            className="rounded-lg p-2 text-app-secondary hover:bg-app-hover hover:text-app-primary"
            title="Edit record"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              setModalOpen(false)
              setEditingItem(null)
              setDeleteId(row.id)
            }}
            className="rounded-lg p-2 text-app-secondary hover:bg-rose-500/10 hover:text-rose-300"
            title="Delete record"
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
        eyebrow="Calamansi Juice"
        title="Expenses"
        actions={
          <PageToolbar
            filter={
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
            actions={
              <Button
                onClick={() => {
                  setEditingItem(null)
                  setModalOpen(true)
                }}
              >
                <Plus size={16} />
                Log Expense
              </Button>
            }
          />
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="Boxes purchased" value={String(totalBoxes)} subtitle={`${expenseData.length} entries`} icon={Package} color="amber" />
        <Card title="Total expenses" value={formatCurrency(totalExpenses)} subtitle="All box sizes" icon={PhilippinePeso} color="red" />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading expense entries…" />
      ) : expenseData.length === 0 ? (
        <EmptyState
          icon={PhilippinePeso}
          title="No expenses logged yet"
          description="Log box purchases by size with price per box."
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
        <DataTable columns={columns} data={expenseData} searchKeys={['description', 'notes', 'date']} searchPlaceholder="Search description or notes…" />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit expense' : 'New expense'} maxWidth="max-w-lg sm:max-w-xl">
        <JuiceExpenseForm
          initialData={editingItem}
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
        description="This entry will be permanently removed."
        confirmLabel="Delete Expense"
      />
    </div>
  )
}
