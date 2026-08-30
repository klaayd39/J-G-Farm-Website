import { useState, useMemo } from 'react'
import { Plus, Download, Pencil, Trash2, Trees } from 'lucide-react'
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
import { HarvestForm } from '../components/forms/HarvestForm'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { useDateRange } from '../hooks/useDateRange'
import { useQueryErrorToast } from '../hooks/useQueryErrorToast'
import { supabase } from '../lib/supabase'
import { formatWeight, formatDate } from '../utils/formatters'
import { kgToBags, formatBags } from '../utils/farmUnits'
import { exportHarvestsCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

export function Harvests() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: harvestData, loading, error, refetch } = useSupabaseQuery('harvests', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  useQueryErrorToast(error)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('harvests').delete().eq('id', deleteId)
      if (deleteError) throw deleteError
      toast.success('Harvest entry deleted')
      setDeleteId(null)
      refetch()
    } catch (err) {
      toast.error(err.message || 'Could not delete this harvest.')
    } finally {
      setDeleting(false)
    }
  }

  const totalHarvestKg = useMemo(
    () => harvestData.reduce((sum, item) => sum + Number(item.kg_harvested || 0), 0),
    [harvestData]
  )

  const totalHarvestBags = useMemo(() => kgToBags(totalHarvestKg), [totalHarvestKg])

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-white">{formatDate(row.date)}</span>,
    },
    {
      header: 'Harvesters',
      accessorKey: 'num_harvesters',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {row.num_harvesters ? `${row.num_harvesters} workers` : '—'}
        </span>
      ),
    },
    {
      header: 'Yield Harvested',
      accessorKey: 'kg_harvested',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-display font-semibold tracking-tight text-white">{formatBags(kgToBags(row.kg_harvested))}</span>
          <span className="block text-xs text-slate-400">{formatWeight(row.kg_harvested)}</span>
        </div>
      ),
    },
    {
      header: 'Notes & Field Info',
      accessorKey: 'notes',
      cell: (row) => <span className="text-xs text-slate-400">{row.notes || '—'}</span>,
    },
    {
      header: '',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => { setEditingItem(row); setModalOpen(true) }} className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white" title="Edit batch">
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => setDeleteId(row.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" title="Delete batch">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Orchard Yield"
        title="Harvest Batches"
        actions={
          <>
            <DateRangeFilter preset={preset} setPreset={setPreset} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} presets={PRESETS} />
            <PageActions>
              {harvestData.length > 0 && (
                <Button variant="secondary" onClick={() => exportHarvestsCSV(harvestData)}>
                  <Download size={15} />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>
              )}
              <Button onClick={() => { setEditingItem(null); setModalOpen(true) }}>
                <Plus size={16} />
                Record Harvest
              </Button>
            </PageActions>
          </>
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <Card title="Total harvested" value={formatBags(totalHarvestBags)} subtitle={`${formatWeight(totalHarvestKg)} · ${harvestData.length} batches`} icon={Trees} color="emerald" />

      {loading ? (
        <LoadingSpinner text="Loading harvest records…" />
      ) : harvestData.length === 0 ? (
        <EmptyState
          icon={Trees}
          title="No harvests logged yet"
          description="Log picking batches, volume yield, and harvester headcount to track harvest records."
          action={<Button onClick={() => { setEditingItem(null); setModalOpen(true) }}>Record First Harvest</Button>}
        />
      ) : (
        <DataTable columns={columns} data={harvestData} searchKeys={['notes', 'date']} searchPlaceholder="Search notes or date…" />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit harvest' : 'New harvest'} maxWidth="max-w-md">
        <HarvestForm initialData={editingItem} onSuccess={() => { setModalOpen(false); refetch() }} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete this harvest entry?" description="This cannot be undone. Associated sales records will remain intact without this batch link." confirmLabel="Delete Harvest" />
    </div>
  )
}
