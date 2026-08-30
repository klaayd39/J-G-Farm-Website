import { useState, useMemo } from 'react'
import { Plus, Download, Pencil, Trash2, TrendingUp, DollarSign, Scale } from 'lucide-react'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { PageHeader } from '../components/ui/PageHeader'
import { PageActions } from '../components/ui/PageActions'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { QueryError } from '../components/ui/QueryError'
import { DateRangeFilter } from '../components/ui/DateRangeFilter'
import { IncomeForm } from '../components/forms/IncomeForm'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useDateRange } from '../hooks/useDateRange'
import { useQueryErrorToast } from '../hooks/useQueryErrorToast'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters'
import { kgToBags, formatBags } from '../utils/farmUnits'
import { exportIncomeCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

export function Income() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: incomeData, loading, error, refetch } = useSupabaseQuery('income', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  const { data: harvestData } = useSupabaseQuery('harvests', {
    orderBy: 'date',
    ascending: false,
  })

  useQueryErrorToast(error)

  const harvestMap = useMemo(
    () => Object.fromEntries(harvestData.map((harvest) => [harvest.id, harvest])),
    [harvestData]
  )

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('income').delete().eq('id', deleteId)
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

  const totalKgSold = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.kg_sold || 0), 0),
    [incomeData]
  )

  const totalRevenue = useMemo(
    () => incomeData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    [incomeData]
  )

  const avgPrice = totalKgSold > 0 ? totalRevenue / totalKgSold : 0

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-white">{formatDate(row.date)}</span>,
    },
    {
      header: 'Batch',
      accessorKey: 'harvest_id',
      cell: (row) => {
        const harvest = harvestMap[row.harvest_id]
        return harvest ? (
          <span className="text-xs font-medium text-slate-300">{formatDate(harvest.date)}</span>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )
      },
    },
    {
      header: 'Buyer / Market',
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
      header: 'Volume / Units',
      accessorKey: 'kg_sold',
      sortable: true,
      cell: (row) => {
        const isBag = Number(row.num_red_bags) > 0
        return (
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${isBag ? 'bg-white/[0.06] text-slate-400' : 'bg-emerald-500/10 text-emerald-400/90'}`}>
              {isBag ? 'Bag' : 'Kg'}
            </span>
            <div>
              {isBag ? (
                <>
                  <span className="font-medium text-slate-200">{row.num_red_bags} bags</span>
                  <span className="block text-xs text-slate-500">{formatWeight(row.kg_sold)}</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-slate-200">{formatWeight(row.kg_sold)}</span>
                  <span className="block text-xs text-slate-500">Sold by kilo · ≈ {formatBags(kgToBags(row.kg_sold))}</span>
                </>
              )}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Unit Price',
      accessorKey: 'price_per_kg',
      sortable: true,
      cell: (row) => {
        if (Number(row.price_per_red_bag) > 0) {
          return (
            <div>
              <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_red_bag)}/bag</span>
              <span className="block text-xs tabular-nums text-slate-500">{formatCurrency(row.price_per_kg)}/kg</span>
            </div>
          )
        }
        return <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_kg)}/kg</span>
      },
    },
    {
      header: 'Total Gross',
      accessorKey: 'total_amount',
      sortable: true,
      cell: (row) => <span className="font-medium tabular-nums text-emerald-300">{formatCurrency(row.total_amount)}</span>,
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => { setEditingItem(row); setModalOpen(true) }} className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white" title="Edit record">
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => setDeleteId(row.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" title="Delete record">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Commercial Sales"
        title="Income Ledger"
        actions={
          <>
            <DateRangeFilter preset={preset} setPreset={setPreset} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} presets={PRESETS} />
            <PageActions>
              {incomeData.length > 0 && (
                <Button variant="secondary" onClick={() => exportIncomeCSV(incomeData)}>
                  <Download size={15} />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
              )}
              <Button onClick={() => { setEditingItem(null); setModalOpen(true) }}>
                <Plus size={16} />
                Record Sale
              </Button>
            </PageActions>
          </>
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card title="Volume sold" value={formatWeight(totalKgSold)} subtitle={`${incomeData.length} sales`} icon={Scale} color="blue" />
        <Card title="Avg. price / kg" value={formatCurrency(avgPrice)} subtitle="Weighted average" icon={TrendingUp} color="emerald" />
        <Card title="Gross revenue" value={formatCurrency(totalRevenue)} subtitle="Bags + loose kg" icon={DollarSign} color="emerald" />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading sales ledger…" />
      ) : incomeData.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No sales logged yet"
          description="Log the first calamansi delivery to start tracking buyers, prices, and revenue performance."
          action={<Button onClick={() => { setEditingItem(null); setModalOpen(true) }}>Record First Sale</Button>}
        />
      ) : (
        <DataTable columns={columns} data={incomeData} searchKeys={['buyer', 'notes', 'date']} searchPlaceholder="Search buyer or notes…" />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit sale' : 'New sale'} maxWidth="max-w-md">
        <IncomeForm
          initialData={editingItem}
          harvests={harvestData}
          linkedSales={incomeData}
          onSuccess={() => { setModalOpen(false); refetch() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete this sale record?" description="This entry will be permanently removed and deducted from gross income." confirmLabel="Delete Sale" />
    </div>
  )
}
