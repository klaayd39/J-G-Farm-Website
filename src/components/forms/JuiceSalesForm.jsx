import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatCurrency } from '../../utils/formatters'
import { calcLinesTotal, linesFromRecord, normalizeLines } from '../../utils/juiceUnits'
import { JUICE_BOTTLE_SIZE_PRESETS } from '../../constants/juiceSizes'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { SizeLineEditor } from '../ui/SizeLineEditor'
import { FormSection, FormTotal, FormActions } from '../ui/FormPrimitives'

export function JuiceSalesForm({ initialData = null, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    buyer: initialData?.buyer || '',
    notes: initialData?.notes || '',
  })
  const [lines, setLines] = useState(() => linesFromRecord(initialData?.lines))

  const totals = calcLinesTotal(lines)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in.')
      return
    }

    const normalized = normalizeLines(lines)
    if (normalized.length === 0) {
      toast.error('Add at least one bottle size with quantity and price per bottle.')
      return
    }

    if (!formData.buyer.trim()) {
      toast.error('Enter the buyer name.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        user_id: user.id,
        date: formData.date,
        buyer: formData.buyer.trim(),
        lines: normalized,
        total_amount: totals.total,
        notes: formData.notes.trim(),
      }

      const result = initialData?.id
        ? await supabase.from('juice_sales').update(payload).eq('id', initialData.id)
        : await supabase.from('juice_sales').insert([payload])

      if (result.error) throw result.error

      toast.success(initialData?.id ? 'Sale updated' : 'Sale recorded')
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save sale.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-1">
      <FormSection>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Sale date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Buyer</label>
            <input
              type="text"
              required
              placeholder="Customer or store name"
              value={formData.buyer}
              onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Bottles sold" description="Add each bottle size sold with quantity and price per bottle.">
        <SizeLineEditor
          lines={lines}
          onChange={setLines}
          sizePresets={JUICE_BOTTLE_SIZE_PRESETS}
          sizeLabel="Bottle size"
          quantityLabel="Number of bottles"
          priceLabel="Price / bottle (₱)"
        />
      </FormSection>

      <FormSection>
        <label className="field-label">Notes</label>
        <textarea
          rows={2}
          placeholder="Optional"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="field-input min-h-[72px] resize-none"
        />
      </FormSection>

      <FormTotal
        label="Total sale"
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : initialData ? 'Update sale' : 'Save sale'}
        </Button>
      </FormActions>
    </form>
  )
}
