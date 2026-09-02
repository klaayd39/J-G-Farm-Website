import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Wheat } from 'lucide-react'
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
import { SilageHarvestForm } from '../../components/forms/SilageHarvestForm'
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery'
import { useDateRange } from '../../hooks/useDateRange'
import { useQueryErrorToast } from '../../hooks/useQueryErrorToast'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/formatters'
import { formatSilageHarvestSummary } from '../../utils/silageUnits'
import { TABLE_STICKY_ACTIONS } from '../../constants/tableColumns'
import toast from 'react-hot-toast'

export function SilageHarvests() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, filters, PRESETS } =
    useDateRange('thisYear')

  const { data: harvestData, loading, error, refetch } = useSupabaseQuery('silage_harvests', {
    orderBy: 'date',
    ascending: false,
    filters,
  })

  useQueryErrorToast(error)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error: deleteError } = await supabase.from('silage_harvests').delete().eq('id', deleteId)
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

  const totals = useMemo(
    () =>
      harvestData.reduce(
        (acc, item) => ({
          bags: acc.bags + Number(item.num_bags || 0),
          cuttings: acc.cuttings + Number(item.num_cuttings || 0),
        }),
        { bags: 0, cuttings: 0 }
      ),
    [harvestData]
  )

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-app-primary">{formatDate(row.date)}</span>,
    },
    {
      header: 'Bags',
      accessorKey: 'num_bags',
      sortable: true,
      cell: (row) => <span className="font-medium tabular-nums text-sky-300">{Number(row.num_bags || 0)}</span>,
    },
    {
      header: 'Cuttings',
      accessorKey: 'num_cuttings',
      sortable: true,
      cell: (row) => <span className="font-medium tabular-nums text-sky-300">{Number(row.num_cuttings || 0)}</span>,
    },
    {
      header: 'Summary',
      cell: (row) => <span className="text-xs text-slate-400">{formatSilageHarvestSummary(row)}</span>,
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
      cell: (row) => <span className="text-xs text-slate-400">{row.notes || '—'}</span>,
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
    <div className="page-stack">
      <PageHeader
        eyebrow="Super Napier Silage"
        title="Harvest Records"
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
                Record Harvest
              </Button>
            }
          />
        }
      />

      {error && <QueryError message={error} onRetry={refetch} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="Total bags" value={String(totals.bags)} subtitle={`${harvestData.length} batches`} icon={Wheat} color="blue" />
        <Card title="Total cuttings" value={String(totals.cuttings)} subtitle="All harvest records" icon={Wheat} color="blue" />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading harvest records…" />
      ) : harvestData.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="No harvests logged yet"
          description="Log silage harvest batches with number of bags and cuttings."
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
        <DataTable columns={columns} data={harvestData} searchKeys={['notes', 'date']} searchPlaceholder="Search notes or date…" />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit harvest' : 'New harvest'} maxWidth="max-w-md">
        <SilageHarvestForm
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
        description="This cannot be undone."
        confirmLabel="Delete Harvest"
      />
    </div>
  )
}
