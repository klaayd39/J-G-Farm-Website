import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatCurrency, CATEGORY_LABELS } from '../../utils/formatters'
import { getReceiptSignedUrl, normalizeReceiptPath, deleteReceipt } from '../../utils/receiptStorage'
import { calcLinesTotal, linesFromRecord, normalizeLines } from '../../utils/juiceUnits'
import { JUICE_BOX_SIZE_PRESETS } from '../../constants/juiceSizes'
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { SizeLineEditor } from '../ui/SizeLineEditor'
import { FormSection, FormTotal, FormActions } from '../ui/FormPrimitives'

export function JuiceExpenseForm({ initialData = null, defaultCategory = 'other', onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState(normalizeReceiptPath(initialData?.receipt_url || ''))
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('')
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    category: initialData?.category || (defaultCategory && defaultCategory !== 'all' ? defaultCategory : 'other'),
    description: initialData?.description || '',
    notes: initialData?.notes || '',
  })
  const [lines, setLines] = useState(() => linesFromRecord(initialData?.lines))

  const totals = calcLinesTotal(lines)

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

      if (receiptUrl && receiptUrl !== data.path) {
        try {
          await deleteReceipt(receiptUrl)
        } catch {
          // Keep going if old receipt cleanup fails.
        }
      }

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

    const normalized = normalizeLines(lines)
    if (normalized.length === 0) {
      toast.error('Add at least one box size with quantity and price per box.')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Enter a description (e.g. supplier or item).')
      return
    }

    setLoading(true)
    try {
      const payload = {
        user_id: user.id,
        date: formData.date,
        category: formData.category,
        description: formData.description.trim(),
        lines: normalized,
        total_amount: totals.total,
        receipt_url: receiptUrl,
        notes: formData.notes.trim(),
      }

      if (initialData?.id) {
        const { error } = await supabase.from('juice_expenses').update(payload).eq('id', initialData.id)
        if (error) throw error
        toast.success('Expense updated!')
      } else {
        const { error } = await supabase.from('juice_expenses').insert([payload])
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
            placeholder="e.g. Corrugated boxes (supplier), packaging tape"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="field-input"
          />
        </div>
      </div>

      <FormSection title="Boxes purchased" description="Add each box size with quantity and price per box.">
        <SizeLineEditor
          lines={lines}
          onChange={setLines}
          sizePresets={JUICE_BOX_SIZE_PRESETS}
          sizeLabel="Box size"
          quantityLabel="Number of boxes"
          priceLabel="Price / box (₱)"
        />
      </FormSection>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Receipt / Voucher Photo</label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-app bg-app-hover px-3.5 py-2 text-xs font-medium text-app-secondary transition-colors hover:border-emerald-400/40 hover:text-app-primary">
              <UploadCloud size={16} className="text-emerald-400" />
              <span>{uploading ? 'Uploading…' : receiptUrl ? 'Change Receipt' : 'Upload Receipt'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {receiptUrl && receiptPreviewUrl && (
              <div className="flex items-center justify-end gap-1.5 sm:shrink-0">
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
                  onClick={async () => {
                    if (receiptUrl) {
                      try {
                        await deleteReceipt(receiptUrl)
                      } catch {
                        toast.error('Could not remove receipt file from storage.')
                        return
                      }
                    }
                    setReceiptUrl('')
                    setReceiptPreviewUrl('')
                  }}
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
          placeholder="Supplier name, official receipt number, or delivery notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="field-input min-h-[80px]"
        />
      </div>

      <FormTotal
        label="Total expense"
        amount={formatCurrency(totals.total)}
        lines={totals.lines.map((line) => ({
          label: `${line.quantity} × ${line.size}`,
          amount: formatCurrency(line.subtotal),
        }))}
      />

      <FormActions>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || uploading}>
          {loading ? 'Saving expense…' : initialData ? 'Update Expense' : 'Save Expense Record'}
        </Button>
      </FormActions>
    </form>
  )
}
