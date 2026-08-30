import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatCurrency, formatWeight } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { PhilippinePeso, Scale } from 'lucide-react'

const RED_BAG_KG = 27

function calcFromRedBags(numRedBags, pricePerRedBag) {
  const bags = Number(numRedBags || 0)
  const pricePerBag = Number(pricePerRedBag || 0)
  return {
    kgSold: bags > 0 ? bags * RED_BAG_KG : 0,
    pricePerKg: pricePerBag > 0 ? pricePerBag / RED_BAG_KG : 0,
    totalIncome: bags * pricePerBag,
  }
}

export function IncomeForm({ initialData = null, harvests = [], onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    buyer: initialData?.buyer || '',
    num_red_bags: initialData?.num_red_bags || '',
    price_per_red_bag: initialData?.price_per_red_bag || '',
    harvest_id: initialData?.harvest_id || '',
    notes: initialData?.notes || '',
  })

  const { kgSold, pricePerKg, totalIncome } = calcFromRedBags(
    formData.num_red_bags,
    formData.price_per_red_bag
  )

  const selectedHarvest = harvests.find((h) => h.id === formData.harvest_id)
  const remainingKg =
    selectedHarvest && kgSold > 0
      ? Number(selectedHarvest.kg_harvested || 0) - kgSold
      : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in to save entries.')
      return
    }

    setLoading(true)
    try {
      const numRedBagsVal = formData.num_red_bags ? parseFloat(formData.num_red_bags) : null
      const pricePerRedBagVal = formData.price_per_red_bag ? parseFloat(formData.price_per_red_bag) : null

      if (!numRedBagsVal || numRedBagsVal <= 0) {
        toast.error('Enter the number of red bags sold.')
        setLoading(false)
        return
      }
      if (!pricePerRedBagVal || pricePerRedBagVal <= 0) {
        toast.error('Enter the price per red bag.')
        setLoading(false)
        return
      }

      const payload = {
        user_id: user.id,
        date: formData.date,
        buyer: formData.buyer.trim(),
        kg_sold: kgSold,
        price_per_kg: pricePerKg,
        harvest_id: formData.harvest_id || null,
        notes: formData.notes.trim(),
      }

      if (numRedBagsVal !== null && !isNaN(numRedBagsVal)) {
        payload.num_red_bags = numRedBagsVal
      }
      if (pricePerRedBagVal !== null && !isNaN(pricePerRedBagVal)) {
        payload.price_per_red_bag = pricePerRedBagVal
      }

      if (initialData?.id) {
        let updateRes = await supabase.from('income').update(payload).eq('id', initialData.id)
        if (updateRes.error && updateRes.error.message?.includes('column') && updateRes.error.message?.includes('does not exist')) {
          delete payload.num_red_bags
          delete payload.price_per_red_bag
          updateRes = await supabase.from('income').update(payload).eq('id', initialData.id)
        }
        if (updateRes.error) throw updateRes.error
        toast.success('Sale entry updated!')
      } else {
        let insertRes = await supabase.from('income').insert([payload])
        if (insertRes.error && insertRes.error.message?.includes('column') && insertRes.error.message?.includes('does not exist')) {
          delete payload.num_red_bags
          delete payload.price_per_red_bag
          insertRes = await supabase.from('income').insert([payload])
        }
        if (insertRes.error) throw insertRes.error
        toast.success('Sale logged successfully!')
      }

      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save income.')
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
          <label className="field-label">Buyer / Market *</label>
          <input
            type="text"
            required
            placeholder="e.g. Balintawak Market, Local Wholesaler"
            value={formData.buyer}
            onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Number of Red Bags *</label>
          <input
            type="number"
            step="1"
            min="0"
            required
            placeholder="e.g. 10"
            value={formData.num_red_bags}
            onChange={(e) => setFormData({ ...formData, num_red_bags: e.target.value })}
            className="field-input"
          />
          <p className="mt-1 text-xs text-slate-500">1 red bag = {RED_BAG_KG} kg</p>
        </div>

        <div>
          <label className="field-label">Price Per Red Bag (₱) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="e.g. 800.00"
            value={formData.price_per_red_bag}
            onChange={(e) => setFormData({ ...formData, price_per_red_bag: e.target.value })}
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Kg Sold (Volume)</label>
          <input
            type="text"
            readOnly
            value={kgSold > 0 ? kgSold.toLocaleString('en-PH', { maximumFractionDigits: 2 }) : '—'}
            className="field-input cursor-not-allowed bg-white/4 text-slate-300"
            tabIndex={-1}
          />
          <p className="mt-1 text-xs text-slate-500">Bags × {RED_BAG_KG} kg</p>
        </div>

        <div>
          <label className="field-label">Price per Kg (₱)</label>
          <input
            type="text"
            readOnly
            value={pricePerKg > 0 ? pricePerKg.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '—'}
            className="field-input cursor-not-allowed bg-white/4 text-slate-300"
            tabIndex={-1}
          />
          <p className="mt-1 text-xs text-slate-500">Price per bag ÷ {RED_BAG_KG}</p>
        </div>
      </div>

      {harvests.length > 0 && (
        <div>
          <label className="field-label">Link to Harvest Batch (Optional)</label>
          <select
            value={formData.harvest_id}
            onChange={(e) => setFormData({ ...formData, harvest_id: e.target.value })}
            className="field-input"
          >
            <option value="">-- Standalone delivery (No batch) --</option>
            {harvests.map((h) => (
              <option key={h.id} value={h.id}>
                {h.date} {h.block_name ? `| ${h.block_name}` : ''} ({h.kg_harvested} kg harvested)
              </option>
            ))}
          </select>
          {remainingKg !== null && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-slate-300">
              <Scale size={15} className="shrink-0 text-slate-400" />
              <span>
                Remaining KG:{' '}
                <span className={remainingKg < 0 ? 'font-medium text-rose-300' : 'font-medium text-slate-200'}>
                  {formatWeight(remainingKg)}
                </span>
                <span className="text-slate-500"> (harvest − sold)</span>
              </span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="field-label">Notes & Remarks</label>
        <textarea
          rows={2}
          placeholder="Optional payment notes, delivery terms or vehicle details..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="field-input min-h-[80px]"
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/25 bg-emerald-950/40 p-4 text-sm text-emerald-200">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-300">
            <PhilippinePeso size={16} />
          </div>
          <span className="font-medium">Total Income</span>
        </div>
        <span className="font-display text-lg font-semibold text-emerald-300">
          {formatCurrency(totalIncome)}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving entry…' : initialData ? 'Update Sale' : 'Save Sale Record'}
        </Button>
      </div>
    </form>
  )
}
