import { useState, useMemo } from 'react'
import { Plus, Download, Pencil, Trash2, TrendingUp, DollarSign, Scale } from 'lucide-react'
import { DataTable } from '../components/ui/DataTable'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { IncomeForm } from '../components/forms/IncomeForm'
import { useSupabaseQuery } from '../hooks/useSupabaseQuery'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatWeight, formatDate } from '../utils/formatters'
import { exportIncomeCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

export function Income() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { data: incomeData, loading, refetch } = useSupabaseQuery('income', {
    orderBy: 'date',
    ascending: false,
  })

  const { data: harvestData } = useSupabaseQuery('harvests', {
    orderBy: 'date',
    ascending: false,
  })

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('income').delete().eq('id', deleteId)
      if (error) throw error
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
        if (row.num_red_bags) {
          return (
            <div>
              <span className="font-medium text-slate-200">{row.num_red_bags} red bags</span>
              {Number(row.kg_sold) > 0 && (
                <span className="block text-xs text-slate-400">({formatWeight(row.kg_sold)})</span>
              )}
            </div>
          )
        }
        return <span className="font-medium text-slate-200">{formatWeight(row.kg_sold)}</span>
      },
    },
    {
      header: 'Unit Price',
      accessorKey: 'price_per_kg',
      sortable: true,
      cell: (row) => {
        if (row.price_per_red_bag) {
          return (
            <div>
              <span className="text-slate-300 font-medium">{formatCurrency(row.price_per_red_bag)} / bag</span>
              {Number(row.price_per_kg) > 0 && (
                <span className="block text-xs text-slate-400">({formatCurrency(row.price_per_kg)}/kg)</span>
              )}
            </div>
          )
        }
        return <span className="text-slate-300 font-medium">{formatCurrency(row.price_per_kg)} / kg</span>
      },
    },
    {
      header: 'Total Gross',
      accessorKey: 'total_amount',
      sortable: true,
      cell: (row) => (
        <span className="font-semibold text-emerald-300">{formatCurrency(row.total_amount)}</span>
      ),
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
            onClick={() => setDeleteId(row.id)}
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
        eyebrow="Commercial Sales"
        title="Income Ledger"
        description="Track calamansi dispatches, volume in kg, price per kilo, and total buyer revenue."
        actions={
          <>
            {incomeData.length > 0 && (
              <Button variant="secondary" onClick={() => exportIncomeCSV(incomeData)}>
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
              Record Sale
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#111e19]/90 to-[#0c1613]/90 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Total Volume Sold</span>
            <Scale size={18} className="text-emerald-400/80" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-white">{formatWeight(totalKgSold)}</p>
          <p className="mt-1 text-xs text-slate-400">{incomeData.length} recorded sales</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#111e19]/90 to-[#0c1613]/90 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Avg. Price Per Kg</span>
            <TrendingUp size={18} className="text-emerald-400/80" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-emerald-300">{formatCurrency(avgPrice)} / kg</p>
          <p className="mt-1 text-xs text-slate-400">Weighted average price</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#111e19]/90 to-[#0c1613]/90 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Gross Revenue</span>
            <DollarSign size={18} className="text-emerald-400/80" />
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-emerald-300">{formatCurrency(totalRevenue)}</p>
          <p className="mt-1 text-xs text-slate-400">All-time sales value</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading sales ledger…" />
      ) : incomeData.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No sales logged yet"
          description="Log the first calamansi delivery to start tracking buyers, prices, and revenue performance."
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
        <DataTable
          columns={columns}
          data={incomeData}
          searchKeys={['buyer', 'notes', 'date']}
          searchPlaceholder="Search buyer or notes…"
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Sale Record' : 'Record New Sale'}
      >
        <IncomeForm
          initialData={editingItem}
          harvests={harvestData}
          linkedSales={incomeData}
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
        description="This entry will be permanently removed and deducted from gross income."
        confirmLabel="Delete Sale"
      />
    </div>
  )
}
