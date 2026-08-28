import { useState, useMemo } from 'react'
import { Plus, Download, Edit2, Trash2, TrendingUp } from 'lucide-react'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { IncomeForm } from '../components/forms/IncomeForm'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters'
import { exportIncomeCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

export function Income() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const { data: incomeData, loading, refetch } = useSupabaseQuery('income', {
    orderBy: 'date',
    ascending: false,
  })

  const { data: harvestData } = useSupabaseQuery('harvests', {
    orderBy: 'date',
    ascending: false,
  })

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this sale record?')) return
    try {
      const { error } = await supabase.from('income').delete().eq('id', id)
      if (error) throw error
      toast.success('Sale record deleted!')
      refetch()
    } catch (err) {
      toast.error(err.message || 'Failed to delete record.')
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
      header: 'Buyer / Market',
      accessorKey: 'buyer',
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-white">{row.buyer}</p>
          {row.notes && <p className="text-xs text-slate-400 truncate max-w-xs">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Kg Sold',
      accessorKey: 'kg_sold',
      sortable: true,
      cell: (row) => formatWeight(row.kg_sold),
    },
    {
      header: 'Price / Kg',
      accessorKey: 'price_per_kg',
      sortable: true,
      cell: (row) => formatCurrency(row.price_per_kg),
    },
    {
      header: 'Total Amount',
      accessorKey: 'total_amount',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-emerald-400">{formatCurrency(row.total_amount)}</span>
      ),
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
            title="Edit sale"
          >
            <Edit2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
            title="Delete sale"
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
            Income & Sales Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Log calamansi deliveries, buyer contracts, and market transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {incomeData.length > 0 && (
            <button
              type="button"
              onClick={() => exportIncomeCSV(incomeData)}
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
            <span>Record Calamansi Sale</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <p className="text-xs text-slate-400">Total Volume Sold</p>
          <p className="mt-1 text-xl font-bold text-white">{formatWeight(totalKgSold)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <p className="text-xs text-slate-400">Weighted Avg Price</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{formatCurrency(avgPrice)} / kg</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <p className="text-xs text-slate-400">Gross Sales Revenue</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Table / Empty State */}
      {loading ? (
        <LoadingSpinner text="Loading sales records..." />
      ) : incomeData.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No Calamansi Sales Recorded"
          description="Log your first harvest batch sale to track market buyers and price trends."
          action={
            <button
              type="button"
              onClick={() => {
                setEditingItem(null)
                setModalOpen(true)
              }}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
            >
              Record First Sale
            </button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={incomeData}
          searchKeys={['buyer', 'notes', 'date']}
          searchPlaceholder="Search buyer, date, notes..."
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Calamansi Sale' : 'Record Calamansi Sale'}
      >
        <IncomeForm
          initialData={editingItem}
          harvests={harvestData}
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
