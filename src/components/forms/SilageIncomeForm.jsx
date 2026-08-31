import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatCurrency } from '../../utils/formatters'
import { calcSilageSale } from '../../utils/silageUnits'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { FormSection, ComputedHint, FormTotal, FormActions } from '../ui/FormPrimitives'

export function SilageIncomeForm({ initialData = null, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    buyer: initialData?.buyer || '',
    num_bags: initialData?.num_bags ? String(initialData.num_bags) : '',
    price_per_bag: initialData?.price_per_bag ? String(initialData.price_per_bag) : '',
    num_cuttings: initialData?.num_cuttings ? String(initialData.num_cuttings) : '',
    price_per_cutting: initialData?.price_per_cutting ? String(initialData.price_per_cutting) : '',
    notes: initialData?.notes || '',
  })

  const sale = calcSilageSale({
    numBags: formData.num_bags,
    pricePerBag: formData.price_per_bag,
    numCuttings: formData.num_cuttings,
    pricePerCutting: formData.price_per_cutting,
  })

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
        buyer: formData.buyer.trim(),
        num_bags: sale.bags,
        price_per_bag: sale.hasBags ? parseFloat(formData.price_per_bag) : 0,
        num_cuttings: sale.cuttings,
        price_per_cutting: sale.hasCuttings ? parseFloat(formData.price_per_cutting) : 0,
        notes: formData.notes.trim(),
      }

      const result = initialData?.id
        ? await supabase.from('silage_income').update(payload).eq('id', initialData.id)
        : await supabase.from('silage_income').insert([payload])

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
              placeholder="Market or buyer name"
              value={formData.buyer}
              onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
      </FormSection>

      <ComputedHint>Enter bags and cuttings together — one Save sale records both parts.</ComputedHint>

      <FormSection title="Sold by bag">
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
        {sale.hasBags && sale.bagIncome > 0 && (
          <ComputedHint>
            {sale.bags} bag{sale.bags === 1 ? '' : 's'} = {formatCurrency(sale.bagIncome)}
          </ComputedHint>
        )}
      </FormSection>

      <FormSection title="Sold by cutting">
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
        {sale.hasCuttings && sale.cuttingIncome > 0 && (
          <ComputedHint>
            {sale.cuttings} cutting{sale.cuttings === 1 ? '' : 's'} = {formatCurrency(sale.cuttingIncome)}
          </ComputedHint>
        )}
      </FormSection>

      {sale.isCombined && (
        <div className="rounded-lg border border-sky-400/10 bg-sky-500/5 px-3 py-2.5 text-[11px] text-sky-200/80">
          {formatCurrency(sale.bagIncome)} bags + {formatCurrency(sale.cuttingIncome)} cuttings ={' '}
          <span className="font-semibold text-sky-200">{formatCurrency(sale.totalIncome)}</span>
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
