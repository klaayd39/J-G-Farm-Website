import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO } from '../../utils/formatters'
import toast from 'react-hot-toast'

export function HarvestForm({ initialData = null, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    block_name: initialData?.block_name || '',
    kg_harvested: initialData?.kg_harvested || '',
    notes: initialData?.notes || '',
  })

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
        block_name: formData.block_name.trim(),
        kg_harvested: parseFloat(formData.kg_harvested),
        notes: formData.notes.trim(),
      }

      if (initialData?.id) {
        const { error } = await supabase.from('harvests').update(payload).eq('id', initialData.id)
        if (error) throw error
        toast.success('Harvest entry updated!')
      } else {
        const { error } = await supabase.from('harvests').insert([payload])
        if (error) throw error
        toast.success('Harvest logged!')
      }

      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save harvest.')
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
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Block / Plot Area *</label>
          <input
            type="text"
            required
            placeholder="e.g. Block A (Old Trees), North Hillside"
            value={formData.block_name}
            onChange={(e) => setFormData({ ...formData, block_name: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Kg Harvested *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="e.g. 245.5"
            value={formData.kg_harvested}
            onChange={(e) => setFormData({ ...formData, kg_harvested: e.target.value })}
            className="mt-1 block min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Notes</label>
        <textarea
          rows={2}
          placeholder="Fruit grade, weather condition, harvesters involved..."
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
          disabled={loading}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Harvest' : 'Save Harvest'}
        </button>
      </div>
    </form>
  )
}
