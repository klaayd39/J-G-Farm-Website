import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatCurrency, formatWeight } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { PhilippinePeso, Scale, ShoppingBag } from 'lucide-react'

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

function getInitialSaleMode(initialData) {
  if (!initialData) return 'bags'
  if (Number(initialData.num_red_bags) > 0) return 'bags'
  if (Number(initialData.kg_sold) > 0 && Number(initialData.price_per_kg) > 0) return 'kg'
  return 'bags'
}

function getPreviouslySoldKg(linkedSales, harvestId, excludeSaleId) {
  if (!harvestId) return 0
  return linkedSales
    .filter((sale) => sale.harvest_id === harvestId && sale.id !== excludeSaleId)
    .reduce((sum, sale) => sum + Number(sale.kg_sold || 0), 0)
}

function formatBags(bags) {
  const value = Number(bags || 0)
  const formatted = value.toLocaleString('en-PH', { maximumFractionDigits: 1 })
  return `${formatted} ${Math.abs(value - 1) < 0.05 ? 'bag' : 'bags'}`
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
  const [saleMode, setSaleMode] = useState(() => getInitialSaleMode(initialData))
  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    buyer: initialData?.buyer || '',
    num_red_bags: initialData?.num_red_bags || '',
    price_per_red_bag: initialData?.price_per_red_bag || '',
    kg_sold: initialData?.kg_sold || '',
    price_per_kg: initialData?.price_per_kg || '',
    harvest_id: initialData?.harvest_id || '',
    notes: initialData?.notes || '',
  })

  const bagCalc = calcFromRedBags(formData.num_red_bags, formData.price_per_red_bag)
  const kgSold =
    saleMode === 'bags' ? bagCalc.kgSold : Number(formData.kg_sold || 0)
  const pricePerKg =
    saleMode === 'bags' ? bagCalc.pricePerKg : Number(formData.price_per_kg || 0)
  const totalIncome =
    saleMode === 'bags'
      ? bagCalc.totalIncome
      : kgSold * pricePerKg

  const selectedHarvest = harvests.find((h) => h.id === formData.harvest_id)
  const harvestKg = selectedHarvest ? Number(selectedHarvest.kg_harvested || 0) : 0
  const harvestBags = harvestKg / RED_BAG_KG
  const previouslySoldKg = getPreviouslySoldKg(
    linkedSales,
    formData.harvest_id,
    initialData?.id
  )
  const remainingKg =
    selectedHarvest && (kgSold > 0 || previouslySoldKg > 0)
      ? harvestKg - previouslySoldKg - kgSold
      : selectedHarvest
        ? harvestKg - previouslySoldKg
        : null
  const remainingBags = remainingKg !== null ? remainingKg / RED_BAG_KG : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in to save entries.')
      return
    }

    setLoading(true)
    try {
      let payload

      if (saleMode === 'bags') {
        const numRedBagsVal = formData.num_red_bags ? parseFloat(formData.num_red_bags) : null
        const pricePerRedBagVal = formData.price_per_red_bag
          ? parseFloat(formData.price_per_red_bag)
          : null

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

        payload = {
          user_id: user.id,
          date: formData.date,
          buyer: formData.buyer.trim(),
          kg_sold: bagCalc.kgSold,
          price_per_kg: bagCalc.pricePerKg,
          num_red_bags: numRedBagsVal,
          price_per_red_bag: pricePerRedBagVal,
          harvest_id: formData.harvest_id || null,
          notes: formData.notes.trim(),
        }
      } else {
        const kgSoldVal = formData.kg_sold ? parseFloat(formData.kg_sold) : null
        const pricePerKgVal = formData.price_per_kg ? parseFloat(formData.price_per_kg) : null

        if (!kgSoldVal || kgSoldVal <= 0) {
          toast.error('Enter the kg sold.')
          setLoading(false)
          return
        }
        if (!pricePerKgVal || pricePerKgVal <= 0) {
          toast.error('Enter the price per kg.')
          setLoading(false)
          return
        }

        payload = {
          user_id: user.id,
          date: formData.date,
          buyer: formData.buyer.trim(),
          kg_sold: kgSoldVal,
          price_per_kg: pricePerKgVal,
          num_red_bags: 0,
          price_per_red_bag: 0,
          harvest_id: formData.harvest_id || null,
          notes: formData.notes.trim(),
        }
      }

      if (initialData?.id) {
        let updateRes = await supabase.from('income').update(payload).eq('id', initialData.id)
        if (
          updateRes.error &&
          updateRes.error.message?.includes('column') &&
          updateRes.error.message?.includes('does not exist')
        ) {
          delete payload.num_red_bags
          delete payload.price_per_red_bag
          updateRes = await supabase.from('income').update(payload).eq('id', initialData.id)
        }
        if (updateRes.error) throw updateRes.error
        toast.success('Sale entry updated!')
      } else {
        let insertRes = await supabase.from('income').insert([payload])
        if (
          insertRes.error &&
          insertRes.error.message?.includes('column') &&
          insertRes.error.message?.includes('does not exist')
        ) {
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
      </div>

      <div>
        <label className="field-label">Sale Type *</label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setSaleMode('bags')}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              saleMode === 'bags'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/8'
            }`}
          >
            <ShoppingBag size={16} className="shrink-0" />
            <span>
              <span className="block font-semibold">Sell by Red Bag</span>
              <span className="block text-xs opacity-80">Whole bags at bag price</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSaleMode('kg')}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              saleMode === 'kg'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/8'
            }`}
          >
            <Scale size={16} className="shrink-0" />
            <span>
              <span className="block font-semibold">Sell by Kilo</span>
              <span className="block text-xs opacity-80">Loose fruit from remaining bags</span>
            </span>
          </button>
        </div>
      </div>

      {saleMode === 'bags' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Number of Red Bags *</label>
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
              value={bagCalc.kgSold > 0 ? bagCalc.kgSold.toLocaleString('en-PH', { maximumFractionDigits: 2 }) : '—'}
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
              value={
                bagCalc.pricePerKg > 0
                  ? bagCalc.pricePerKg.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })
                  : '—'
              }
              className="field-input cursor-not-allowed bg-white/4 text-slate-300"
              tabIndex={-1}
            />
            <p className="mt-1 text-xs text-slate-500">Price per bag ÷ {RED_BAG_KG}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Kg Sold (Volume) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="e.g. 1350"
              value={formData.kg_sold}
              onChange={(e) => setFormData({ ...formData, kg_sold: e.target.value })}
              className="field-input"
            />
            <p className="mt-1 text-xs text-slate-500">
              {remainingBags !== null && remainingBags > 0
                ? `≈ ${formatBags(remainingBags)} remaining (${formatWeight(remainingKg)})`
                : `Enter loose kg sold (1 bag = ${RED_BAG_KG} kg)`}
            </p>
          </div>

          <div>
            <label className="field-label">Price per Kg (₱) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="e.g. 45.00"
              value={formData.price_per_kg}
              onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
      )}

      {harvests.length > 0 && (
        <div>
          <label className="field-label">Link to Harvest Batch (Optional)</label>
          <select
            value={formData.harvest_id}
            onChange={(e) => setFormData({ ...formData, harvest_id: e.target.value })}
            className="field-input"
          >
            <option value="">-- Standalone delivery (No batch) --</option>
            {harvests.map((h) => {
              const bags = Number(h.kg_harvested || 0) / RED_BAG_KG
              return (
                <option key={h.id} value={h.id}>
                  {h.date}
                  {h.block_name ? ` | ${h.block_name}` : ''} ({formatBags(bags)} / {h.kg_harvested} kg)
                </option>
              )
            })}
          </select>
          {selectedHarvest && (
            <div className="mt-2 space-y-2 rounded-xl border border-white/8 bg-white/4 px-3 py-3 text-sm text-slate-300">
              <div className="flex items-start gap-2">
                <Scale size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="space-y-1">
                  <p>
                    Harvest:{' '}
                    <span className="font-medium text-slate-200">
                      {formatBags(harvestBags)} ({formatWeight(harvestKg)})
                    </span>
                  </p>
                  {previouslySoldKg > 0 && (
                    <p>
                      Already sold:{' '}
                      <span className="font-medium text-slate-200">
                        {formatBags(previouslySoldKg / RED_BAG_KG)} ({formatWeight(previouslySoldKg)})
                      </span>
                    </p>
                  )}
                  {remainingKg !== null && (
                    <p>
                      Remaining:{' '}
                      <span
                        className={
                          remainingKg < 0 ? 'font-medium text-rose-300' : 'font-medium text-emerald-300'
                        }
                      >
                        {formatBags(remainingBags)} ({formatWeight(remainingKg)})
                      </span>
                      {saleMode === 'kg' && remainingBags > 0 && (
                        <span className="text-slate-500"> — sell loose by kilo</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
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
