import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, CATEGORY_LABELS } from '../../utils/formatters'
import { UploadCloud, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export function ExpenseForm({ initialData = null, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState(initialData?.receipt_url || '')
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    category: initialData?.category || 'fertilizer',
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    notes: initialData?.notes || '',
  })

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filename = `${user.id}/${Date.now()}.${ext}`

      const { data, error } = await supabase.storage.from('receipts').upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(data.path)
      setReceiptUrl(publicUrlData.publicUrl)
      toast.success('Receipt uploaded!')
    } catch (err) {
      toast.error(err.message || 'Failed to upload image. (Ensure receipts bucket exists)')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        user_id: user.id,
        date: formData.date,
        category: formData.category,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        receipt_url: receiptUrl,
        notes: formData.notes.trim(),
      }

      if (initialData?.id) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', initialData.id)
        if (error) throw error
        toast.success('Expense updated!')
      } else {
        const { error } = await supabase.from('expenses').insert([payload])
        if (error) throw error
        toast.success('Expense logged!')
      }

      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save expense.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Date *</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <option key={catKey} value={catKey}>
                {catLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Description *</label>
          <input
            type="text"
            required
            placeholder="e.g. 14-14-14 Complete Fertilizer (2 sacks), Pruning labor"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Amount (₱) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="e.g. 2400.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Receipt / Photo</label>
          <div className="mt-1 flex items-center gap-2">
            <label className="flex min-h-[48px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 hover:border-emerald-500 hover:text-white">
              <UploadCloud size={16} />
              <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {receiptUrl && (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-emerald-400 hover:bg-slate-700"
                title="View uploaded receipt"
              >
                <ImageIcon size={20} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Notes</label>
        <textarea
          rows={2}
          placeholder="Supplier info, voucher numbers, or additional context..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || uploading}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </form>
  )
}
