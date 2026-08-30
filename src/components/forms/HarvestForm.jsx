import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatWeight } from '../../utils/formatters'
import { RED_BAG_KG, bagsToKg, formatBags, splitHarvestKg, formatRedBagTotal } from '../../utils/farmUnits'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import {
  FormSection,
  ComputedHint,
  FormActions,
} from '../ui/FormPrimitives'

export function HarvestForm({ initialData = null, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const initialSplit = splitHarvestKg(initialData?.kg_harvested)
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    num_red_bags: initialSplit.wholeBags > 0 ? String(initialSplit.wholeBags) : '',
    loose_kg: initialSplit.looseKg > 0 ? String(initialSplit.looseKg) : '',
    num_harvesters: initialData?.num_harvesters || '',
    notes: initialData?.notes || '',
  })

  const bagKg = bagsToKg(formData.num_red_bags)
  const looseKg = Number(formData.loose_kg || 0)
  const totalKg = bagKg + looseKg

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in.')
      return
    }

    const numRedBagsVal = formData.num_red_bags !== '' ? parseFloat(formData.num_red_bags) : 0
    const looseKgVal = formData.loose_kg !== '' ? parseFloat(formData.loose_kg) : 0

    if (numRedBagsVal < 0 || looseKgVal < 0) {
      toast.error('Bags and kilos cannot be negative.')
      return
    }

    if (numRedBagsVal <= 0 && looseKgVal <= 0) {
      toast.error('Enter red bags and/or additional kilos harvested.')
      return
    }

    const kgHarvested = bagsToKg(numRedBagsVal) + (looseKgVal || 0)
    if (kgHarvested <= 0) {
      toast.error('Total harvest must be greater than zero.')
      return
    }

    setLoading(true)
    try {
      const numHarvestersVal = formData.num_harvesters ? parseInt(formData.num_harvesters, 10) : null

      const payload = {
        user_id: user.id,
        date: formData.date,
        kg_harvested: kgHarvested,
        notes: formData.notes.trim(),
      }

      if (numHarvestersVal !== null && !isNaN(numHarvestersVal)) {
        payload.num_harvesters = numHarvestersVal
      }

      if (initialData?.id) {
        let updateRes = await supabase.from('harvests').update(payload).eq('id', initialData.id)
        if (
          updateRes.error &&
          updateRes.error.message?.includes('column') &&
          updateRes.error.message?.includes('does not exist')
        ) {
          delete payload.num_harvesters
          updateRes = await supabase.from('harvests').update(payload).eq('id', initialData.id)
        }
        if (updateRes.error) throw updateRes.error
        toast.success('Harvest updated')
      } else {
        let insertRes = await supabase.from('harvests').insert([payload])
        if (
          insertRes.error &&
          insertRes.error.message?.includes('column') &&
          insertRes.error.message?.includes('does not exist')
        ) {
          delete payload.num_harvesters
          insertRes = await supabase.from('harvests').insert([payload])
        }
        if (insertRes.error) throw insertRes.error
        toast.success('Harvest recorded')
      }

      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save harvest.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormSection>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Harvesters</label>
            <input
              type="number"
              step="1"
              min="1"
              placeholder="Optional"
              value={formData.num_harvesters}
              onChange={(e) => setFormData({ ...formData, num_harvesters: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Yield" description={`1 red bag = ${RED_BAG_KG} kg · bags and loose kilos are added together`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label">Red bags</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={formData.num_red_bags}
              onChange={(e) => setFormData({ ...formData, num_red_bags: e.target.value })}
              className="field-input"
            />
            {bagKg > 0 && (
              <ComputedHint>{formatBags(formData.num_red_bags)} = {formatWeight(bagKg)}</ComputedHint>
            )}
          </div>
          <div>
            <label className="field-label">Additional kilos</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={formData.loose_kg}
              onChange={(e) => setFormData({ ...formData, loose_kg: e.target.value })}
              className="field-input"
            />
            {looseKg > 0 && <ComputedHint>{formatWeight(looseKg)} loose</ComputedHint>}
          </div>
        </div>

        {totalKg > 0 && (
          <div className="rounded-lg border border-[#d7ffe0]/10 bg-[#d7ffe0]/5 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#d7ffe0]/70">Total yield</p>
            <p className="mt-0.5 font-display text-lg font-semibold tabular-nums text-[#d7ffe0]">
              {formatRedBagTotal(totalKg)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#d7ffe0]/60">
              {formatWeight(totalKg)} total
              {bagKg > 0 && looseKg > 0 && ` · ${formatBags(formData.num_red_bags)} + ${formatWeight(looseKg)} loose`}
            </p>
          </div>
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
