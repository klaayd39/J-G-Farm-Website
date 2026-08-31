import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatCurrency, formatDateTime, formatUserLabel, nowTimeHHMM } from '../../utils/formatters'
import { calcJuiceSale, formatJuiceCount } from '../../utils/juiceUnits'
import { isMissingColumnError, omitKeys } from '../../utils/supabaseErrors'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { FormSection, ComputedHint, FormTotal, FormActions } from '../ui/FormPrimitives'

function parseTimeInput(timeStr) {
  if (!timeStr) return ''
  const parts = String(timeStr).split(':')
  if (parts.length < 2) return ''
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
}

export function JuiceIncomeForm({ initialData = null, profileMap = {}, onSuccess, onCancel }) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    sale_time: initialData?.sale_time ? parseTimeInput(initialData.sale_time) : nowTimeHHMM(),
    buyer: initialData?.buyer || '',
    num_bags: initialData?.num_bags ? String(initialData.num_bags) : '',
    price_per_bag: initialData?.price_per_bag ? String(initialData.price_per_bag) : '',
    num_cuttings: initialData?.num_cuttings ? String(initialData.num_cuttings) : '',
    price_per_cutting: initialData?.price_per_cutting ? String(initialData.price_per_cutting) : '',
    notes: initialData?.notes || '',
  })

  const sale = calcJuiceSale({
    numBags: formData.num_bags,
    pricePerBag: formData.price_per_bag,
    numCuttings: formData.num_cuttings,
    pricePerCutting: formData.price_per_cutting,
  })

  async function saveRecord(payload) {
    const optionalKeys = ['sale_time']
    let attempt = { ...payload }

    for (let tries = 0; tries <= optionalKeys.length; tries += 1) {
      const result = initialData?.id
        ? await supabase.from('juice_income').update(attempt).eq('id', initialData.id)
        : await supabase.from('juice_income').insert([attempt])

      if (!result.error) return
      if (!isMissingColumnError(result.error)) throw result.error
      attempt = omitKeys(attempt, optionalKeys)
    }

    throw new Error('Could not save sale.')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in.')
      return
    }

    if (!sale.hasBags && !sale.hasCuttings) {
      toast.error('Enter bags sold and/or cuttings sold.')
      return
    }

    if (sale.hasBags && (!formData.price_per_bag || Number(formData.price_per_bag) <= 0)) {
      toast.error('Enter the price per bag.')
      return
    }

    if (sale.hasCuttings && (!formData.price_per_cutting || Number(formData.price_per_cutting) <= 0)) {
      toast.error('Enter the price per cutting.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        user_id: user.id,
        date: formData.date,
        sale_time: formData.sale_time ? `${formData.sale_time}:00` : null,
        buyer: formData.buyer.trim(),
        num_bags: sale.bags,
        price_per_bag: sale.hasBags ? parseFloat(formData.price_per_bag) : 0,
        num_cuttings: sale.cuttings,
        price_per_cutting: sale.hasCuttings ? parseFloat(formData.price_per_cutting) : 0,
        notes: formData.notes.trim(),
      }

      await saveRecord(payload)
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
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="field-label">Sale date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="field-input"
            />
          </div>
          <div className="min-w-0">
            <label className="field-label">Sale time</label>
            <input
              type="time"
              required
              value={formData.sale_time}
              onChange={(e) => setFormData({ ...formData, sale_time: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="field-label">Buyer</label>
          <input
            type="text"
            required
            placeholder="Market or buyer name"
            value={formData.buyer}
            onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
            className="field-input"
          />
        </div>
        {!isEditing && profile && (
          <p className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
            Will be logged by <span className="font-medium text-slate-300">{formatUserLabel(profile)}</span>
          </p>
        )}
        {isEditing && initialData?.created_at && (
          <p className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
            Logged {formatDateTime(initialData.created_at)} by{' '}
            <span className="font-medium text-slate-300">{formatUserLabel(profileMap[initialData.user_id])}</span>
          </p>
        )}
      </FormSection>

      {!isEditing && (
        <ComputedHint>Enter bags and cuttings together — one Save sale records both parts.</ComputedHint>
      )}

      <FormSection title="Sold by bag" description="Optional if selling cuttings only">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Number of bags</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={formData.num_bags}
              onChange={(e) => setFormData({ ...formData, num_bags: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Price / bag (₱)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.price_per_bag}
              onChange={(e) => setFormData({ ...formData, price_per_bag: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
        {sale.hasBags && Number(formData.price_per_bag) > 0 && (
          <ComputedHint>
            {formatJuiceCount(sale.bags, 'bag', 'bags')} × {formatCurrency(Number(formData.price_per_bag))} ={' '}
            {formatCurrency(sale.bagIncome)}
          </ComputedHint>
        )}
      </FormSection>

      <FormSection title="Sold by cutting" description="Optional if selling bags only">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Number of cuttings</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={formData.num_cuttings}
              onChange={(e) => setFormData({ ...formData, num_cuttings: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Price / cutting (₱)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.price_per_cutting}
              onChange={(e) => setFormData({ ...formData, price_per_cutting: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
        {sale.hasCuttings && Number(formData.price_per_cutting) > 0 && (
          <ComputedHint>
            {formatJuiceCount(sale.cuttings, 'cutting', 'cuttings')} × {formatCurrency(Number(formData.price_per_cutting))} ={' '}
            {formatCurrency(sale.cuttingIncome)}
          </ComputedHint>
        )}
      </FormSection>

      {sale.isCombined && (
        <div className="rounded-lg border border-amber-400/15 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-200/90">
          {formatCurrency(sale.bagIncome)} bags + {formatCurrency(sale.cuttingIncome)} cuttings ={' '}
          <span className="font-semibold text-amber-200">{formatCurrency(sale.totalIncome)}</span>
        </div>
      )}

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

      <FormTotal label="This sale income" amount={formatCurrency(sale.totalIncome)} />

      <FormActions>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : initialData ? 'Update' : 'Save sale'}
        </Button>
      </FormActions>
    </form>
  )
}
