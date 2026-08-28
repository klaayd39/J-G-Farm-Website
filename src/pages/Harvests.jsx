import { useState, useMemo } from 'react'
import { Plus, Download, Pencil, Trash2, Trees, Users } from 'lucide-react'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { HarvestForm } from '../components/forms/HarvestForm'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { supabase } from '../lib/supabase'
import { formatWeight, formatDate } from '../utils/formatters'
import { exportHarvestsCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

export function Harvests() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { data: harvestData, loading, refetch } = useSupabaseQuery('harvests', {
    orderBy: 'date',
    ascending: false,
  })

  const { data: profileData } = useSupabaseQuery('profiles')

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('harvests').delete().eq('id', deleteId)
      if (error) throw error
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

  const totalHarvestersCount = useMemo(() => {
    const totalFromBatches = harvestData.reduce(
      (sum, item) => sum + (Number(item.num_harvesters) || 0),
      0
    )
    if (totalFromBatches > 0) return totalFromBatches
    if (profileData && profileData.length > 0) return profileData.length
    return harvestData.length > 0 ? harvestData.length : 0
  }, [harvestData, profileData])

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
        <span className="font-display font-semibold text-white tracking-tight">
          {formatWeight(row.kg_harvested)}
        </span>
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
          <button
            type="button"
            onClick={() => {
              setEditingItem(row)
              setModalOpen(true)
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/8 hover:text-white"
            title="Edit batch"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeleteId(row.id)}
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
            title="Delete batch"
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
        eyebrow="Orchard Yield"
        title="Harvest Batches"
        description="Monitor calamansi yield, picking records, and harvester team output."
        actions={
          <>
            {harvestData.length > 0 && (
              <Button variant="secondary" onClick={() => exportHarvestsCSV(harvestData)}>
                <Download size={15} />
                Export CSV
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingItem(null)
                setModalOpen(true)
              }}
            >
              <Plus size={16} />
              Record Harvest
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#111e19]/90 to-[#0c1613]/90 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Total Yield Picked</span>
            <Trees size={18} className="text-emerald-400/80" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-emerald-300">{formatWeight(totalHarvestKg)}</p>
          <p className="mt-1 text-xs text-slate-400">Total volume recorded</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#111e19]/90 to-[#0c1613]/90 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Total Harvester</span>
            <Users size={18} className="text-emerald-400/80" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-white">{totalHarvestersCount}</p>
          <p className="mt-1 text-xs text-slate-400">Total harvesters logged across batches</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading harvest records…" />
      ) : harvestData.length === 0 ? (
        <EmptyState
          icon={Trees}
          title="No harvests logged yet"
          description="Log picking batches, volume yield, and harvester headcount to track harvest records."
          action={
            <Button
              onClick={() => {
                setEditingItem(null)
                setModalOpen(true)
              }}
            >
              Record First Harvest
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={harvestData}
          searchKeys={['block_name', 'notes', 'date']}
          searchPlaceholder="Search block or notes…"
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Harvest Entry' : 'Record Harvest Batch'}
      >
        <HarvestForm
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
        title="Delete this harvest entry?"
        description="This cannot be undone. Associated sales records will remain intact without this batch link."
        confirmLabel="Delete Harvest"
      />
    </div>
  )
}
