import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO } from '../../utils/formatters'
import toast from 'react-hot-toast'

export function IncomeForm({ initialData = null, harvests = [], onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    buyer: initialData?.buyer || '',
    kg_sold: initialData?.kg_sold || '',
    price_per_kg: initialData?.price_per_kg || '',
    harvest_id: initialData?.harvest_id || '',
    notes: initialData?.notes || '',
  })

  const totalPreview = (Number(formData.kg_sold || 0) * Number(formData.price_per_kg || 0)).toFixed(2)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in to save entries.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        user_id: user.id,
        date: formData.date,
        buyer: formData.buyer.trim(),
        kg_sold: parseFloat(formData.kg_sold),
        price_per_kg: parseFloat(formData.price_per_kg),
        harvest_id: formData.harvest_id || null,
        notes: formData.notes.trim(),
      }

      if (initialData?.id) {
        const { error } = await supabase.from('income').update(payload).eq('id', initialData.id)
        if (error) throw error
        toast.success('Income entry updated successfully!')
      } else {
        const { error } = await supabase.from('income').insert([payload])
        if (error) throw error
        toast.success('Income logged successfully!')
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
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Buyer / Market *</label>
          <input
            type="text"
            required
            placeholder="e.g. Balintawak Market, Local Wholesaler"
            value={formData.buyer}
            onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Kg Sold *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="e.g. 150.5"
            value={formData.kg_sold}
            onChange={(e) => setFormData({ ...formData, kg_sold: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Price per Kg (₱) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="e.g. 45.00"
            value={formData.price_per_kg}
            onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {harvests.length > 0 && (
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Link to Harvest Batch (Optional)</label>
          <select
            value={formData.harvest_id}
            onChange={(e) => setFormData({ ...formData, harvest_id: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">-- None --</option>
            {harvests.map((h) => (
              <option key={h.id} value={h.id}>
                {h.date} | {h.block_name || 'General'} ({h.kg_harvested} kg)
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Notes</label>
        <textarea
          rows={2}
          placeholder="Optional notes or batch details..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
        <span>Estimated Total Amount:</span>
        <span className="text-base font-bold text-emerald-400">₱{Number(totalPreview).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
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
          disabled={loading}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Sale' : 'Save Sale'}
        </button>
      </div>
    </form>
  )
}
