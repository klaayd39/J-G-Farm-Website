import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatCurrency, formatWeight } from '../../utils/formatters'
import {
  RED_BAG_KG,
  calcBagSale,
  calcKgSale,
  formatBags,
  getHarvestInventory,
  kgToBags,
  validateSaleInventory,
} from '../../utils/farmUnits'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import {
  FormSection,
  ComputedHint,
  SegmentedControl,
  InventorySummary,
  FormTotal,
  FormActions,
} from '../ui/FormPrimitives'

function isKgSale(data) {
  return data && Number(data.num_red_bags || 0) <= 0 && Number(data.kg_sold || 0) > 0
}

function isBagSale(data) {
  return data && Number(data.num_red_bags || 0) > 0
}

export function IncomeForm({
  initialData = null,
  harvests = [],
  linkedSales = [],
  onSuccess,
  onCancel,
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const editingKg = initialData ? isKgSale(initialData) : false
  const editingBag = initialData ? isBagSale(initialData) : false

  const [saleType, setSaleType] = useState(editingKg ? 'kg' : 'bag')

  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    buyer: initialData?.buyer || '',
    num_red_bags: editingBag ? initialData.num_red_bags : '',
    price_per_red_bag: editingBag ? initialData.price_per_red_bag : '',
    remaining_kg: editingKg && initialData?.kg_sold ? String(initialData.kg_sold) : '',
    price_per_kg: editingKg ? initialData.price_per_kg : '',
    harvest_id: initialData?.harvest_id || '',
    notes: initialData?.notes || '',
  })

  const selectedHarvest = harvests.find((h) => h.id === formData.harvest_id)
  const isBagMode = saleType === 'bag'

  const bagSale = calcBagSale(formData.num_red_bags, formData.price_per_red_bag)
  const kgSale = calcKgSale(formData.remaining_kg, formData.price_per_kg)
  const equivalentBags = kgToBags(kgSale.kgSold)
  const saleIncome = isBagMode ? bagSale.income : kgSale.income
  const pendingKg = isBagMode ? bagSale.kgSold : kgSale.kgSold

  const inventory = selectedHarvest
    ? getHarvestInventory(selectedHarvest, linkedSales, initialData?.id, pendingKg)
    : null

  async function saveRecord(payload) {
    let result = initialData?.id
      ? await supabase.from('income').update(payload).eq('id', initialData.id)
      : await supabase.from('income').insert([payload])

    if (
      result.error &&
      result.error.message?.includes('column') &&
      result.error.message?.includes('does not exist')
    ) {
      delete payload.num_red_bags
      delete payload.price_per_red_bag
      result = initialData?.id
        ? await supabase.from('income').update(payload).eq('id', initialData.id)
        : await supabase.from('income').insert([payload])
    }

    if (result.error) throw result.error
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in to save entries.')
      return
    }

    setLoading(true)
    try {
      const validation = validateSaleInventory({
        harvestId: formData.harvest_id,
        harvests,
        inventory,
        requireBatch: harvests.length > 0,
      })
      if (!validation.ok) {
        toast.error(validation.message)
        setLoading(false)
        return
      }

      const shared = {
        user_id: user.id,
        date: formData.date,
        buyer: formData.buyer.trim(),
        harvest_id: formData.harvest_id || null,
        notes: formData.notes.trim(),
      }

      if (isBagMode) {
        const numRedBagsVal = parseFloat(formData.num_red_bags)
        const pricePerRedBagVal = parseFloat(formData.price_per_red_bag)

        if (!numRedBagsVal || numRedBagsVal <= 0) {
          toast.error('Enter the number of bags sold by the bag.')
          setLoading(false)
          return
        }
        if (!pricePerRedBagVal || pricePerRedBagVal <= 0) {
          toast.error('Enter the price per bag.')
          setLoading(false)
          return
        }

        await saveRecord({
          ...shared,
          num_red_bags: numRedBagsVal,
          price_per_red_bag: pricePerRedBagVal,
          kg_sold: bagSale.kgSold,
          price_per_kg: bagSale.pricePerKg,
        })
      } else {
        const remainingKgVal = parseFloat(formData.remaining_kg)
        const pricePerKgVal = parseFloat(formData.price_per_kg)

        if (!remainingKgVal || remainingKgVal <= 0) {
          toast.error('Enter the remaining kilos to sell.')
          setLoading(false)
          return
        }
        if (!pricePerKgVal || pricePerKgVal <= 0) {
          toast.error('Enter the price per kg.')
          setLoading(false)
          return
        }

        await saveRecord({
          ...shared,
          num_red_bags: 0,
          price_per_red_bag: 0,
          kg_sold: remainingKgVal,
          price_per_kg: pricePerKgVal,
        })
      }

      toast.success(initialData?.id ? 'Sale updated' : 'Sale recorded')
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save income.')
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

      {harvests.length > 0 && (
        <FormSection title="Harvest batch">
          <select
            required
            value={formData.harvest_id}
            onChange={(e) => setFormData({ ...formData, harvest_id: e.target.value })}
            className="field-input"
          >
            <option value="">Select batch</option>
            {harvests.map((h) => {
              const { harvestBags, remainingBags } = getHarvestInventory(
                h,
                linkedSales,
                initialData?.id
              )
              return (
                <option key={h.id} value={h.id}>
                  {h.date} — {formatBags(harvestBags)} ({h.kg_harvested} kg)
                  {remainingBags < harvestBags ? ` · ${formatBags(remainingBags)} left` : ''}
                </option>
              )
            })}
          </select>
          {inventory && (
            <div className="mt-3">
              <InventorySummary
                items={[
                  {
                    label: 'Harvested',
                    value: formatBags(inventory.harvestBags),
                    sub: formatWeight(inventory.harvestKg),
                  },
                  {
                    label: 'Sold',
                    value: formatBags(inventory.soldBags),
                    sub: formatWeight(inventory.soldKg),
                  },
                  {
                    label: 'Remaining',
                    value: formatBags(inventory.remainingBags),
                    sub: formatWeight(inventory.remainingKg),
                    tone: inventory.remainingKg < 0 ? 'text-rose-300' : 'text-emerald-300',
                  },
                ]}
              />
            </div>
          )}
        </FormSection>
      )}

      {!initialData && (
        <FormSection title="Sale type">
          <SegmentedControl
            value={saleType}
            onChange={setSaleType}
            options={[
              { value: 'bag', label: 'Sold by bag' },
              { value: 'kg', label: 'Sold by kilo' },
            ]}
          />
          <ComputedHint>
            {isBagMode
              ? 'Record whole bags sold at bag price.'
              : 'Enter remaining kilos sold loose at price per kg.'}
          </ComputedHint>
        </FormSection>
      )}

      {isBagMode ? (
        <FormSection title="Sold by bag" description={`1 bag = ${RED_BAG_KG} kg`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Bags sold</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                placeholder="e.g. 50"
                value={formData.num_red_bags}
                onChange={(e) => setFormData({ ...formData, num_red_bags: e.target.value })}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Price / bag (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={formData.price_per_red_bag}
                onChange={(e) =>
                  setFormData({ ...formData, price_per_red_bag: e.target.value })
                }
                className="field-input"
              />
            </div>
          </div>
          {bagSale.bags > 0 && (
            <ComputedHint>
              {formatBags(bagSale.bags)} = {formatWeight(bagSale.kgSold)} ·{' '}
              {formatCurrency(bagSale.income)}
            </ComputedHint>
          )}
        </FormSection>
      ) : (
        <FormSection title="Sold by kilo" description={`1 bag = ${RED_BAG_KG} kg`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Remaining kilos</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 1350"
                value={formData.remaining_kg}
                onChange={(e) => setFormData({ ...formData, remaining_kg: e.target.value })}
                className="field-input"
              />
              {kgSale.kgSold > 0 && (
                <ComputedHint>≈ {formatBags(equivalentBags)} at {RED_BAG_KG} kg/bag</ComputedHint>
              )}
            </div>
            <div>
              <label className="field-label">Price / kg (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={formData.price_per_kg}
                onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                className="field-input"
              />
            </div>
          </div>
          {kgSale.kgSold > 0 && Number(formData.price_per_kg) > 0 && (
            <ComputedHint>
              {formatWeight(kgSale.kgSold)} × {formatCurrency(Number(formData.price_per_kg))}/kg ={' '}
              {formatCurrency(kgSale.income)}
            </ComputedHint>
          )}
        </FormSection>
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

      <FormTotal label="This sale income" amount={formatCurrency(saleIncome)} />

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
