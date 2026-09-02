import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, PhilippinePeso, GlassWater } from 'lucide-react'
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
import { JuiceSalesForm } from '../../components/forms/JuiceSalesForm'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useDateRange } from '../../hooks/useDateRange'
import { useQueryErrorToast } from '../../hooks/useQueryErrorToast'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { calcLinesTotal, formatLinesSummary } from '../../utils/juiceUnits'
import { TABLE_STICKY_ACTIONS } from '../../constants/tableColumns'
import toast from 'react-hot-toast'

export function JuiceSales() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: salesData, loading, error, refetch } = useSupabaseQuery('juice_sales', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  useQueryErrorToast(error)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('juice_sales').delete().eq('id', deleteId)
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
    () => salesData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [salesData]
  )

  const totalBottles = useMemo(
    () =>
      salesData.reduce((sum, item) => sum + calcLinesTotal(item.lines).totalQuantity, 0),
    [salesData]
  )

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-app-primary">{formatDate(row.date)}</span>,
    },
    {
      header: 'Buyer',
      accessorKey: 'buyer',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-app-primary">{row.buyer}</p>
          {row.notes && <p className="max-w-xs truncate text-xs text-app-secondary">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Bottles',
      accessorKey: 'lines',
      cell: (row) => (
        <div>
          <span className="font-medium text-app-primary">{formatLinesSummary(row.lines)}</span>
          <span className="block text-xs text-app-muted">
            {calcLinesTotal(row.lines).totalQuantity} bottle{calcLinesTotal(row.lines).totalQuantity === 1 ? '' : 's'} total
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
                {line.size}: {formatCurrency(line.price_per_unit)}/bottle
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
      cell: (row) => <span className="font-medium tabular-nums text-amber-400">{formatCurrency(row.total_amount)}</span>,
    },
    {
      header: '',
      className: TABLE_STICKY_ACTIONS,
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
    <div className="page-stack">
      <PageHeader
        eyebrow="Calamansi Juice"
        title="Sales Ledger"
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
                Record Sale
              </Button>
            }
          />
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="Bottles sold" value={String(totalBottles)} subtitle={`${salesData.length} sales`} icon={GlassWater} color="amber" />
        <Card title="Gross revenue" value={formatCurrency(totalRevenue)} subtitle="All bottle sizes" icon={TrendingUp} color="amber" />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading sales ledger…" />
      ) : salesData.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No sales logged yet"
          description="Record bottle sales by size with price per bottle."
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
        <DataTable columns={columns} data={salesData} searchKeys={['buyer', 'notes', 'date']} searchPlaceholder="Search buyer or notes…" />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit sale' : 'New sale'} maxWidth="max-w-lg sm:max-w-xl">
        <JuiceSalesForm
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
