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
import { JuiceIncomeForm } from '../../components/forms/JuiceIncomeForm'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useDateRange } from '../../hooks/useDateRange'
import { useQueryErrorToast } from '../../hooks/useQueryErrorToast'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate, formatTime, formatDateTime, formatUserLabel } from '../../utils/formatters'
import { formatJuiceCount, isCombinedJuiceSale } from '../../utils/juiceUnits'
import toast from 'react-hot-toast'

export function JuiceIncomePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: incomeData, loading, error, refetch } = useSupabaseQuery('juice_income', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  const { data: profiles } = useSupabaseQuery(
    'profiles',
    { select: 'id, full_name, email', orderBy: 'full_name', ascending: true },
    ['team-profiles']
  )

  useQueryErrorToast(error)

  const profileMap = useMemo(
    () => Object.fromEntries((profiles || []).map((p) => [p.id, p])),
    [profiles]
  )

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('juice_income').delete().eq('id', deleteId)
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

  const columns = [
    {
      header: 'Sale',
      accessorKey: 'date',
      sortable: true,
      className: 'align-top min-w-[6.5rem]',
      cell: (row) => (
        <div>
          <span className="font-medium text-white">{formatDate(row.date)}</span>
          {row.sale_time && <span className="block text-xs tabular-nums text-slate-400">{formatTime(row.sale_time)}</span>}
        </div>
      ),
    },
    {
      header: 'Buyer',
      accessorKey: 'buyer',
      sortable: true,
      className: 'align-top min-w-[7rem]',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{row.buyer}</p>
          {row.notes && <p className="truncate text-xs text-slate-400">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Volume',
      accessorKey: 'num_bags',
      sortable: true,
      className: 'align-top min-w-[8rem]',
      cell: (row) => {
        const isCombined = isCombinedJuiceSale(row)
        const isBag = !isCombined && Number(row.num_bags) > 0
        return (
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${isCombined ? 'bg-amber-500/15 text-amber-300' : isBag ? 'bg-white/[0.06] text-slate-400' : 'bg-amber-500/10 text-amber-400/90'}`}>
              {isCombined ? 'Both' : isBag ? 'Bag' : 'Cutting'}
            </span>
            <div>
              {isCombined ? (
                <span className="font-medium text-slate-200">
                  {formatJuiceCount(row.num_bags, 'bag', 'bags')} + {formatJuiceCount(row.num_cuttings, 'cutting', 'cuttings')}
                </span>
              ) : isBag ? (
                <span className="font-medium text-slate-200">{formatJuiceCount(row.num_bags, 'bag', 'bags')}</span>
              ) : (
                <span className="font-medium text-slate-200">{formatJuiceCount(row.num_cuttings, 'cutting', 'cuttings')}</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Price',
      accessorKey: 'price_per_bag',
      sortable: true,
      className: 'align-top whitespace-nowrap min-w-[5.5rem]',
      cell: (row) => {
        if (isCombinedJuiceSale(row)) {
          return (
            <div>
              <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_bag)}/bag</span>
              <span className="block text-xs tabular-nums text-slate-500">{formatCurrency(row.price_per_cutting)}/cutting</span>
            </div>
          )
        }
        if (Number(row.num_bags) > 0) {
          return <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_bag)}/bag</span>
        }
        return <span className="font-medium tabular-nums text-slate-300">{formatCurrency(row.price_per_cutting)}/cutting</span>
      },
    },
    {
      header: 'Total',
      accessorKey: 'total_amount',
      sortable: true,
      className: 'align-top whitespace-nowrap text-right min-w-[5rem]',
      cell: (row) => <span className="font-medium tabular-nums text-amber-300">{formatCurrency(row.total_amount)}</span>,
    },
    {
      header: 'Logged',
      accessorKey: 'created_at',
      sortable: true,
      className: 'align-top hidden lg:table-cell min-w-[8rem]',
      cell: (row) => (
        <div>
          <span className="text-xs tabular-nums text-slate-300">{formatDateTime(row.created_at)}</span>
          <span className="block text-[11px] text-slate-500">{formatUserLabel(profileMap[row.user_id])}</span>
        </div>
      ),
    },
    {
      header: '',
      className: 'align-top w-16 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-0.5">
          <button type="button" onClick={() => { setEditingItem(row); setModalOpen(true) }} className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white" title="Edit">
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => { setModalOpen(false); setEditingItem(null); setDeleteId(row.id) }} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Juice Sales"
        title="Income Ledger"
        actions={
          <>
            <DateRangeFilter preset={preset} setPreset={setPreset} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} presets={PRESETS} />
            <PageActions>
              <Button onClick={() => { setEditingItem(null); setModalOpen(true) }}>
                <Plus size={16} />
                Record Sale
              </Button>
            </PageActions>
          </>
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <Card title="Gross revenue" value={formatCurrency(totalRevenue)} subtitle={`${incomeData.length} sales`} icon={PhilippinePeso} color="amber" />

      {loading ? (
        <LoadingSpinner text="Loading sales ledger…" />
      ) : incomeData.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No sales logged yet"
          description="Record bag and cutting sales with prices to track juice income."
          action={<Button onClick={() => { setEditingItem(null); setModalOpen(true) }}>Record First Sale</Button>}
        />
      ) : (
        <DataTable columns={columns} data={incomeData} searchKeys={['buyer', 'notes', 'date']} searchPlaceholder="Search buyer or notes…" />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit sale' : 'New sale'} maxWidth="max-w-lg sm:max-w-xl">
        <JuiceIncomeForm
          initialData={editingItem}
          profileMap={profileMap}
          onSuccess={() => { setModalOpen(false); refetch() }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete this sale record?" description="This entry will be permanently removed." confirmLabel="Delete Sale" />
    </div>
  )
}
