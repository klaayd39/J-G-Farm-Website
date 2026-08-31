import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO } from '../../utils/formatters'
import { formatJuiceCount } from '../../utils/juiceUnits'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { FormSection, ComputedHint, FormActions } from '../ui/FormPrimitives'

export function JuiceHarvestForm({ initialData = null, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    num_bags: initialData?.num_bags ? String(initialData.num_bags) : '',
    num_cuttings: initialData?.num_cuttings ? String(initialData.num_cuttings) : '',
    notes: initialData?.notes || '',
  })

  const numBags = Number(formData.num_bags || 0)
  const numCuttings = Number(formData.num_cuttings || 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in.')
      return
    }

    if (numBags < 0 || numCuttings < 0) {
      toast.error('Bags and cuttings cannot be negative.')
      return
    }

    if (numBags <= 0 && numCuttings <= 0) {
      toast.error('Enter number of bags and/or cuttings.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        user_id: user.id,
        date: formData.date,
        num_bags: numBags,
        num_cuttings: numCuttings,
        notes: formData.notes.trim(),
      }

      const result = initialData?.id
        ? await supabase.from('juice_harvests').update(payload).eq('id', initialData.id)
        : await supabase.from('juice_harvests').insert([payload])

      if (result.error) throw result.error

      toast.success(initialData?.id ? 'Harvest updated' : 'Harvest recorded')
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save harvest.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormSection>
        <label className="field-label">Date</label>
        <input
          type="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="field-input"
        />
      </FormSection>

      <FormSection title="Harvest yield" description="Log bags and cuttings harvested">
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
        </div>
        {(numBags > 0 || numCuttings > 0) && (
          <ComputedHint>
            {[
              numBags > 0 ? formatJuiceCount(numBags, 'bag', 'bags') : null,
              numCuttings > 0 ? formatJuiceCount(numCuttings, 'cutting', 'cuttings') : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </ComputedHint>
        )}
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

      <FormActions>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : initialData ? 'Update' : 'Save harvest'}
        </Button>
      </FormActions>
    </form>
  )
}
