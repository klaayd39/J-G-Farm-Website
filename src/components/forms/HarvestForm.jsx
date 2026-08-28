import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'

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
        toast.success('Harvest batch logged!')
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
          <label className="field-label">Kg Harvested (Yield) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="e.g. 245.50"
            value={formData.kg_harvested}
            onChange={(e) => setFormData({ ...formData, kg_harvested: e.target.value })}
            className="field-input"
          />
        </div>
      </div>

      <div>
        <label className="field-label">Notes & Field Conditions</label>
        <textarea
          rows={2}
          placeholder="Fruit grade, weather condition, harvesters involved..."
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving harvest…' : initialData ? 'Update Harvest' : 'Save Harvest Batch'}
        </Button>
      </div>
    </form>
  )
}
