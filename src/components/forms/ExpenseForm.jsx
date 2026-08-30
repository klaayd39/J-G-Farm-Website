import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, CATEGORY_LABELS } from '../../utils/formatters'
import { getReceiptSignedUrl, normalizeReceiptPath } from '../../utils/receiptStorage'
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'

export function ExpenseForm({ initialData = null, defaultCategory = 'fertilizer', onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState(normalizeReceiptPath(initialData?.receipt_url || ''))
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('')
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    category: initialData?.category || (defaultCategory && defaultCategory !== 'all' ? defaultCategory : 'fertilizer'),
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    notes: initialData?.notes || '',
  })

  useEffect(() => {
    if (!initialData && defaultCategory && defaultCategory !== 'all') {
      setFormData((prev) => ({ ...prev, category: defaultCategory }))
    }
  }, [defaultCategory, initialData])

  useEffect(() => {
    let active = true

    async function loadPreview() {
      if (!receiptUrl) {
        if (active) setReceiptPreviewUrl('')
        return
      }

      try {
        const signedUrl = await getReceiptSignedUrl(receiptUrl)
        if (active) setReceiptPreviewUrl(signedUrl)
      } catch {
        if (active) setReceiptPreviewUrl('')
      }
    }

    loadPreview()
    return () => {
      active = false
    }
  }, [receiptUrl])

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

      setReceiptUrl(data.path)
      toast.success('Receipt photo attached!')
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
        toast.success('Expense logged successfully!')
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
          <label className="field-label">Date *</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="field-input"
          >
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <option key={catKey} value={catKey}>
                {catLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Description / Item *</label>
          <input
            type="text"
            required
            placeholder="e.g. 14-14-14 Complete Fertilizer (2 sacks), Pruning labor"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Cost Amount (₱) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="e.g. 2400.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Receipt / Voucher Photo</label>
          <div className="flex items-center gap-2">
            <label className="flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-emerald-400 hover:bg-emerald-500/5 hover:text-white">
              <UploadCloud size={16} className="text-emerald-400" />
              <span>{uploading ? 'Uploading…' : receiptUrl ? 'Change Receipt' : 'Upload Receipt'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {receiptUrl && receiptPreviewUrl && (
              <div className="flex items-center gap-1.5">
                <a
                  href={receiptPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  title="View attached receipt"
                >
                  <ImageIcon size={18} />
                </a>
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="flex h-[46px] w-9 items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:text-rose-400"
                  title="Remove receipt"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="field-label">Notes & Supplier Details</label>
        <textarea
          rows={2}
          placeholder="Supplier name, official receipt number, or plot notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="field-input min-h-[80px]"
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || uploading}>
          {loading ? 'Saving expense…' : initialData ? 'Update Expense' : 'Save Expense Record'}
        </Button>
      </div>
    </form>
  )
}
