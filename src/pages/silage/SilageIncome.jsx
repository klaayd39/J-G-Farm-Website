import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, PhilippinePeso } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageActions } from '../../components/ui/PageActions'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { QueryError } from '../../components/ui/QueryError'
import { DateRangeFilter } from '../../components/ui/DateRangeFilter'
import { SilageIncomeForm } from '../../components/forms/SilageIncomeForm'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useDateRange } from '../../hooks/useDateRange'
import { useQueryErrorToast } from '../../hooks/useQueryErrorToast'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { calcSilageSale, formatSilageSaleSummary } from '../../utils/silageUnits'
import toast from 'react-hot-toast'

export function SilageIncome() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: incomeData, loading, error, refetch } = useSupabaseQuery('silage_income', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  useQueryErrorToast(error)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('silage_income').delete().eq('id', deleteId)
      if (deleteError) throw deleteError
      toast.success('Sale record removed')
      setDeleteId(null)
      refetch()
    } catch (err) {
      toast.error(err.message || 'Could not delete this sale.')
    } finally {
      setDeleting(false)
    }
  }

  const totalRevenue = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [incomeData]
  )

  const totalBagsSold = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.num_bags || 0), 0),
    [incomeData]
  )

  const totalCuttingsSold = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.num_cuttings || 0), 0),
    [incomeData]
  )

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-white">{formatDate(row.date)}</span>,
    },
    {
      header: 'Buyer',
      accessorKey: 'buyer',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-white">{row.buyer}</p>
          {row.notes && <p className="max-w-xs truncate text-xs text-slate-400">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Volume',
      accessorKey: 'num_bags',
      sortable: true,
      cell: (row) => {
        const sale = calcSilageSale({
          numBags: row.num_bags,
          pricePerBag: row.price_per_bag,
          numCuttings: row.num_cuttings,
          pricePerCutting: row.price_per_cutting,
        })
        return (
          <div className="flex items-start gap-2">
            <span
              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                sale.isCombined ? 'bg-sky-500/10 text-sky-300' : sale.hasBags ? 'bg-white/[0.06] text-slate-400' : 'bg-sky-500/10 text-sky-300'
              }`}
            >
              {sale.isCombined ? 'Both' : sale.hasBags ? 'Bag' : 'Cutting'}
            </span>
            <span className="font-medium text-slate-200">{formatSilageSaleSummary(row)}</span>
          </div>
        )
      },
    },
    {
      header: 'Unit Price',
      accessorKey: 'price_per_bag',
      sortable: true,
      cell: (row) => {
        const sale = calcSilageSale({
          numBags: row.num_bags,
          pricePerBag: row.price_per_bag,
          numCuttings: row.num_cuttings,
          pricePerCutting: row.price_per_cutting,
        })
        if (sale.isCombined) {
          return (
            <div>
              <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_bag)}/bag</span>
              <span className="block text-xs tabular-nums text-slate-500">{formatCurrency(row.price_per_cutting)}/cutting</span>
            </div>
          )
        }
        if (sale.hasBags) {
          return <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_bag)}/bag</span>
        }
        return <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_cutting)}/cutting</span>
      },
    },
    {
      header: 'Total',
      accessorKey: 'total_amount',
      sortable: true,
      className: 'whitespace-nowrap',
      cell: (row) => <span className="font-medium tabular-nums text-sky-300">{formatCurrency(row.total_amount)}</span>,
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
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
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
        eyebrow="Super Napier Silage"
        title="Income Ledger"
        actions={
          <>
            <DateRangeFilter
              preset={preset}
              setPreset={setPreset}
              customFrom={customFrom}
              setCustomFrom={setCustomFrom}
              customTo={customTo}
              setCustomTo={setCustomTo}
              presets={PRESETS}
            />
            <PageActions>
              <Button
                onClick={() => {
                  setEditingItem(null)
                  setModalOpen(true)
                }}
              >
                <Plus size={16} />
                Record Sale
              </Button>
            </PageActions>
          </>
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card title="Bags sold" value={String(totalBagsSold)} subtitle={`${incomeData.length} sales`} icon={TrendingUp} color="blue" />
        <Card title="Cuttings sold" value={String(totalCuttingsSold)} subtitle="All sales" icon={TrendingUp} color="blue" />
        <Card title="Gross revenue" value={formatCurrency(totalRevenue)} subtitle="Bags + cuttings" icon={PhilippinePeso} color="emerald" />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading sales ledger…" />
      ) : incomeData.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No sales logged yet"
          description="Log silage sales by bags and cuttings with prices."
          action={
            <Button
              onClick={() => {
                setEditingItem(null)
                setModalOpen(true)
              }}
            >
              Record First Sale
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={incomeData} searchKeys={['buyer', 'notes', 'date']} searchPlaceholder="Search buyer or notes…" />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit sale' : 'New sale'} maxWidth="max-w-lg">
        <SilageIncomeForm
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
        title="Delete this sale record?"
        description="This entry will be permanently removed."
        confirmLabel="Delete Sale"
      />
    </div>
  )
}
