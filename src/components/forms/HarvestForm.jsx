import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatWeight } from '../../utils/formatters'
import { RED_BAG_KG, bagsToKg, formatBags, getHarvestParts, formatRedBagEquivalent, formatHarvestBreakdown, kgFromHarvestParts } from '../../utils/farmUnits'
import { isMissingColumnError, omitKeys } from '../../utils/supabaseErrors'
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

  const initialParts = getHarvestParts(initialData ?? {})
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    num_red_bags: initialParts.wholeBags > 0 ? String(initialParts.wholeBags) : '',
    loose_kg: initialParts.looseKg > 0 ? String(initialParts.looseKg) : '',
    num_harvesters: initialData?.num_harvesters || '',
    notes: initialData?.notes || '',
  })

  const bagKg = bagsToKg(formData.num_red_bags)
  const looseKg = Number(formData.loose_kg || 0)
  const wholeBags = Number(formData.num_red_bags || 0)
  const totalKg = kgFromHarvestParts(wholeBags, looseKg)

  async function saveHarvest(payload) {
    const optionalKeys = ['num_harvesters', 'num_red_bags', 'loose_kg']
    let attempt = { ...payload }

    for (let tries = 0; tries <= optionalKeys.length; tries += 1) {
      const result = initialData?.id
        ? await supabase.from('harvests').update(attempt).eq('id', initialData.id)
        : await supabase.from('harvests').insert([attempt])

      if (!result.error) return result
      if (!isMissingColumnError(result.error)) throw result.error

      attempt = omitKeys(attempt, optionalKeys)
    }

    throw new Error('Could not save harvest. Run supabase/migration_harvest_bag_parts.sql in Supabase, then try again.')
  }

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

    const kgHarvested = kgFromHarvestParts(numRedBagsVal, looseKgVal)
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
        num_red_bags: numRedBagsVal,
        loose_kg: looseKgVal,
        kg_harvested: kgHarvested,
        notes: formData.notes.trim(),
      }

      if (numHarvestersVal !== null && !isNaN(numHarvestersVal)) {
        payload.num_harvesters = numHarvestersVal
      }

      if (initialData?.id) {
        await saveHarvest(payload)
        toast.success('Harvest updated')
      } else {
        await saveHarvest(payload)
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
              {formatRedBagEquivalent(wholeBags, looseKg)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#d7ffe0]/60">
              {formatHarvestBreakdown({ num_red_bags: wholeBags, loose_kg: looseKg, kg_harvested: totalKg })}
              {' · '}
              {formatWeight(totalKg)} total
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
