import { useState, useMemo } from 'react'
import { Plus, Download, Edit2, Trash2, Trees } from 'lucide-react'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { HarvestForm } from '../components/forms/HarvestForm'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { supabase } from '../lib/supabase'
import { formatWeight, formatDate } from '../utils/formatters'
import { exportHarvestsCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

export function Harvests() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const { data: harvestData, loading, refetch } = useSupabaseQuery('harvests', {
    orderBy: 'date',
    ascending: false,
  })

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this harvest record?')) return
    try {
      const { error } = await supabase.from('harvests').delete().eq('id', id)
      if (error) throw error
      toast.success('Harvest entry deleted!')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Failed to delete harvest.')
    }
  }

  const totalHarvestKg = useMemo(
    () => harvestData.reduce((sum, item) => sum + Number(item.kg_harvested || 0), 0),
    [harvestData]
  )

  const blockBreakdown = useMemo(() => {
    const map = {}
    harvestData.forEach((h) => {
      const block = h.block_name || 'General'
      map[block] = (map[block] || 0) + Number(h.kg_harvested || 0)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [harvestData])

  const columns = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => <span className="font-medium text-white">{formatDate(row.date)}</span>,
    },
    {
      header: 'Block / Area',
      accessorKey: 'block_name',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <Trees size={13} className="text-emerald-400" />
          {row.block_name || 'General'}
        </span>
      ),
    },
    {
      header: 'Yield (Kg)',
      accessorKey: 'kg_harvested',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-white">{formatWeight(row.kg_harvested)}</span>
      ),
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
      cell: (row) => <span className="text-xs text-slate-400">{row.notes || '—'}</span>,
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
            title="Edit harvest"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
            title="Delete harvest"
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
            Calamansi Harvest Logs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Track daily picking yields per orchard block and monitor tree plot productivity
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {harvestData.length > 0 && (
            <button
              type="button"
              onClick={() => exportHarvestsCSV(harvestData)}
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
            <span>Record Harvest Batch</span>
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <p className="text-xs text-slate-400">All-Time Calamansi Picked</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{formatWeight(totalHarvestKg)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <p className="text-xs text-slate-400">Total Harvest Sessions</p>
          <p className="mt-1 text-xl font-bold text-white">{harvestData.length} logs</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <p className="text-xs text-slate-400">Top Producing Block</p>
          <p className="mt-1 text-xl font-bold text-white">
            {blockBreakdown[0] ? `${blockBreakdown[0][0]} (${formatWeight(blockBreakdown[0][1])})` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Table / Empty State */}
      {loading ? (
        <LoadingSpinner text="Loading harvest records..." />
      ) : harvestData.length === 0 ? (
        <EmptyState
          icon={Trees}
          title="No Harvests Recorded Yet"
          description="Log picking batches per tree block to know which orchard zones generate the highest yield."
          action={
            <button
              type="button"
              onClick={() => {
                setEditingItem(null)
                setModalOpen(true)
              }}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
            >
              Record First Harvest
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={harvestData}
          searchKeys={['block_name', 'notes', 'date']}
          searchPlaceholder="Search block name, date, notes..."
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Harvest Record' : 'Record Harvest Batch'}
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
    </div>
  )
}
