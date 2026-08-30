import { useState, useMemo } from 'react'
import { Plus, Download, Pencil, Trash2, TrendingUp, PhilippinePeso, Scale } from 'lucide-react'
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
import { formatCurrency, formatWeight, formatDate, formatTime, formatDateTime, formatUserLabel } from '../utils/formatters'
import { formatRedBagTotal, formatHarvestRedBags, isCombinedIncomeSale } from '../utils/farmUnits'
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

  const { data: allIncome, refetch: refetchAllIncome } = useSupabaseQuery(
    'income',
    { orderBy: 'date', ascending: false },
    ['inventory-linked']
  )

  const { data: harvestData } = useSupabaseQuery('harvests', {
    orderBy: 'date',
    ascending: false,
  })

  const { data: profiles } = useSupabaseQuery(
    'profiles',
    { select: 'id, full_name, email', orderBy: 'full_name', ascending: true },
    ['team-profiles']
  )

  useQueryErrorToast(error)

  const harvestMap = useMemo(
    () => Object.fromEntries(harvestData.map((harvest) => [harvest.id, harvest])),
    [harvestData]
  )

  const profileMap = useMemo(
    () => Object.fromEntries((profiles || []).map((p) => [p.id, p])),
    [profiles]
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
      refetchAllIncome()
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

  const columns = [
    {
      header: 'Sale',
      accessorKey: 'date',
      sortable: true,
      className: 'align-top min-w-[6.5rem]',
      cell: (row) => (
        <div>
          <span className="font-medium text-white">{formatDate(row.date)}</span>
          {row.sale_time && (
            <span className="block text-xs tabular-nums text-slate-400">{formatTime(row.sale_time)}</span>
          )}
          <span className="mt-1 block text-[10px] text-slate-600 2xl:hidden">
            {formatUserLabel(profileMap[row.user_id])}
          </span>
        </div>
      ),
    },
    {
      header: 'Batch',
      accessorKey: 'harvest_id',
      className: 'align-top hidden md:table-cell min-w-[5.5rem]',
      cell: (row) => {
        const harvest = harvestMap[row.harvest_id]
        return harvest ? (
          <div>
            <span className="text-xs font-medium text-slate-300">{formatDate(harvest.date)}</span>
            <span className="block text-[11px] text-slate-500">{formatHarvestRedBags(harvest)}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )
      },
    },
    {
      header: 'Buyer',
      accessorKey: 'buyer',
      sortable: true,
      className: 'align-top min-w-[7rem] max-w-[11rem]',
      cell: (row) => {
        const harvest = harvestMap[row.harvest_id]
        return (
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{row.buyer}</p>
            {row.notes && <p className="truncate text-xs text-slate-400">{row.notes}</p>}
            {harvest && (
              <p className="mt-0.5 truncate text-[10px] text-slate-600 md:hidden">
                Batch {formatDate(harvest.date)}
              </p>
            )}
          </div>
        )
      },
    },
    {
      header: 'Volume',
      accessorKey: 'kg_sold',
      sortable: true,
      className: 'align-top min-w-[8.5rem]',
      cell: (row) => {
        const isCombined = isCombinedIncomeSale(row)
        const isBag = !isCombined && Number(row.num_red_bags) > 0
        return (
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${isCombined ? 'bg-[#d7ffe0]/10 text-[#d7ffe0]/90' : isBag ? 'bg-white/[0.06] text-slate-400' : 'bg-emerald-500/10 text-emerald-400/90'}`}>
              {isCombined ? 'Both' : isBag ? 'Bag' : 'Kg'}
            </span>
            <div>
              {isCombined ? (
                <>
                  <span className="font-medium text-slate-200">
                    {row.num_red_bags} bag{Number(row.num_red_bags) === 1 ? '' : 's'} + {formatWeight(row.loose_kg_sold)}
                  </span>
                  <span className="block text-xs text-slate-500">{formatWeight(row.kg_sold)} total · {formatRedBagTotal(row.kg_sold)}</span>
                </>
              ) : isBag ? (
                <>
                  <span className="font-medium text-slate-200">{row.num_red_bags} bags</span>
                  <span className="block text-xs text-slate-500">{formatWeight(row.kg_sold)}</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-slate-200">{formatWeight(row.kg_sold)}</span>
                  <span className="block text-xs text-slate-500">Sold by kilo · {formatRedBagTotal(row.kg_sold)}</span>
                </>
              )}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Price',
      accessorKey: 'price_per_kg',
      sortable: true,
      className: 'align-top whitespace-nowrap min-w-[5.5rem]',
      cell: (row) => {
        if (isCombinedIncomeSale(row)) {
          return (
            <div>
              <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_red_bag)}/bag</span>
              <span className="block text-xs tabular-nums text-slate-500">{formatCurrency(row.price_per_kg)}/kg loose</span>
            </div>
          )
        }
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
      header: 'Total',
      accessorKey: 'total_amount',
      sortable: true,
      className: 'align-top whitespace-nowrap text-right min-w-[5rem]',
      cell: (row) => <span className="font-medium tabular-nums text-emerald-300">{formatCurrency(row.total_amount)}</span>,
    },
    {
      header: 'Logged',
      accessorKey: 'created_at',
      sortable: true,
      className: 'align-top hidden 2xl:table-cell min-w-[8rem]',
      cell: (row) => (
        <div>
          <span className="text-xs tabular-nums text-slate-300">{formatDateTime(row.created_at)}</span>
          <span className="block text-[11px] text-slate-500">{formatUserLabel(profileMap[row.user_id])}</span>
        </div>
      ),
    },
    {
      header: '',
      className: 'align-top w-16 text-right sticky right-0 bg-[#0a0a0a]/95 backdrop-blur-sm',
      cell: (row) => (
        <div className="flex items-center justify-end gap-0.5">
          <button type="button" onClick={() => { setEditingItem(row); setModalOpen(true) }} className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white" title="Edit record">
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => { setModalOpen(false); setEditingItem(null); setDeleteId(row.id) }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" title="Delete record">
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
          <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-start xl:justify-end">
            <DateRangeFilter preset={preset} setPreset={setPreset} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} presets={PRESETS} className="xl:flex-1" />
            <PageActions>
              {incomeData.length > 0 && (
                <Button variant="secondary" onClick={() => exportIncomeCSV(incomeData, { profileMap, harvestMap })}>
                  <Download size={15} />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
              )}
              <Button onClick={() => { setEditingItem(null); setModalOpen(true) }}>
                <Plus size={16} />
                Record Sale
              </Button>
            </PageActions>
          </div>
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="Volume sold" value={formatWeight(totalKgSold)} subtitle={`${incomeData.length} sales`} icon={Scale} color="blue" />
        <Card title="Gross revenue" value={formatCurrency(totalRevenue)} subtitle="Bags + loose kg" icon={PhilippinePeso} color="emerald" />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit sale' : 'New sale'} maxWidth="max-w-lg sm:max-w-xl">
        <IncomeForm
          initialData={editingItem}
          harvests={harvestData}
          linkedSales={allIncome}
          profileMap={profileMap}
          onSuccess={() => {
            setModalOpen(false)
            refetch()
            refetchAllIncome()
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete this sale record?" description="This entry will be permanently removed and deducted from gross income." confirmLabel="Delete Sale" />
    </div>
  )
}
