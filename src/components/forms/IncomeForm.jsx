import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { todayISO, formatCurrency, formatWeight, formatDate, formatTime, formatUserLabel, nowTimeHHMM } from '../../utils/formatters'
import {
  RED_BAG_KG,
  calcBagSale,
  calcKgSale,
  calcCombinedSale,
  formatBags,
  formatRedBagTotal,
  formatHarvestRedBags,
  getHarvestKg,
  getHarvestInventory,
  validateSaleInventory,
  getLooseKgAvailable,
  getLooseKgAvailableAfterPendingBags,
  isCombinedIncomeSale,
} from '../../utils/farmUnits'
import { isMissingColumnError, omitKeys } from '../../utils/supabaseErrors'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import {
  FormSection,
  ComputedHint,
  InventorySummary,
  FormTotal,
  FormActions,
} from '../ui/FormPrimitives'

function isKgOnlySale(data) {
  if (!data) return false
  if (isCombinedIncomeSale(data)) return false
  return Number(data.num_red_bags || 0) <= 0 && Number(data.kg_sold || 0) > 0
}

function isBagOnlySale(data) {
  if (!data) return false
  if (isCombinedIncomeSale(data)) return false
  return Number(data.num_red_bags || 0) > 0
}

function inventoryItems(inventory, pendingKg) {
  const afterSaleKg = inventory.remainingKg
  const items = [
    {
      label: 'Harvested',
      value: formatRedBagTotal(inventory.harvestKg),
      sub: formatWeight(inventory.harvestKg),
    },
    {
      label: 'Already sold',
      value: formatRedBagTotal(inventory.soldKg),
      sub: formatWeight(inventory.soldKg),
    },
  ]

  if (pendingKg > 0.001) {
    items.push({
      label: 'This sale',
      value: formatRedBagTotal(pendingKg),
      sub: formatWeight(pendingKg),
      tone: 'text-sky-300',
    })
  }

  items.push({
    label: 'After this sale',
    value: formatRedBagTotal(afterSaleKg),
    sub: formatWeight(afterSaleKg),
    tone: afterSaleKg < 0 ? 'text-rose-300' : afterSaleKg <= 0.001 ? 'text-emerald-300' : 'text-amber-300',
  })

  return items
}

function parseTimeInput(timeStr) {
  if (!timeStr) return ''
  const parts = String(timeStr).split(':')
  if (parts.length < 2) return ''
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
}

function formatBatchOptionLabel(harvest, availableKg) {
  const dateLabel = formatDate(harvest.date)
  if (availableKg <= 0.001) {
    return `${dateLabel} · sold out`
  }
  return `${dateLabel} · ${formatWeight(availableKg)} available`
}

export function IncomeForm({
  initialData = null,
  harvests = [],
  linkedSales = [],
  profileMap = {},
  onSuccess,
  onCancel,
}) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const isEditing = Boolean(initialData?.id)
  const editingKgOnly = isEditing && isKgOnlySale(initialData)
  const editingBagOnly = isEditing && isBagOnlySale(initialData)
  const editingCombined = isEditing && isCombinedIncomeSale(initialData)

  const [formData, setFormData] = useState({
    date: initialData?.date || todayISO(),
    sale_time: initialData?.sale_time ? parseTimeInput(initialData.sale_time) : nowTimeHHMM(),
    buyer: initialData?.buyer || '',
    num_red_bags: editingBagOnly || editingCombined ? initialData.num_red_bags : '',
    price_per_red_bag: editingBagOnly || editingCombined ? initialData.price_per_red_bag : '',
    loose_kg:
      editingCombined
        ? String(initialData.loose_kg_sold)
        : editingKgOnly && initialData?.kg_sold
          ? String(initialData.kg_sold)
          : '',
    price_per_kg: editingKgOnly || editingCombined ? initialData.price_per_kg : '',
    harvest_id: initialData?.harvest_id || '',
    notes: initialData?.notes || '',
  })

  const selectedHarvest = harvests.find((h) => h.id === formData.harvest_id)

  const bagSale = calcBagSale(formData.num_red_bags, formData.price_per_red_bag)
  const kgSale = calcKgSale(formData.loose_kg, formData.price_per_kg)
  const combinedSale = calcCombinedSale({
    numRedBags: formData.num_red_bags,
    pricePerRedBag: formData.price_per_red_bag,
    looseKg: formData.loose_kg,
    pricePerKg: formData.price_per_kg,
  })

  const pendingKg = isEditing
    ? editingCombined
      ? combinedSale.totalKgSold
      : editingBagOnly
        ? bagSale.kgSold
        : kgSale.kgSold
    : combinedSale.totalKgSold
  const saleIncome = isEditing
    ? editingCombined
      ? combinedSale.totalIncome
      : editingBagOnly
        ? bagSale.income
        : kgSale.income
    : combinedSale.totalIncome

  const inventory = selectedHarvest
    ? getHarvestInventory(selectedHarvest, linkedSales, initialData?.id, pendingKg)
    : null

  const looseKgAvailable = inventory
    ? getLooseKgAvailableAfterPendingBags(inventory, bagSale.kgSold)
    : 0

  function handleHarvestChange(harvestId) {
    const harvest = harvests.find((h) => h.id === harvestId)
    if (!harvest) {
      setFormData((prev) => ({ ...prev, harvest_id: harvestId }))
      return
    }

    const inv = getHarvestInventory(harvest, linkedSales, initialData?.id)
    const loose = getLooseKgAvailable(inv)
    const wholeBags = inv.maxWholeBags

    setFormData((prev) => ({
      ...prev,
      harvest_id: harvestId,
      num_red_bags: !isEditing && wholeBags > 0 ? String(wholeBags) : '',
      loose_kg: !isEditing && loose > 0 ? String(loose) : '',
    }))
  }

  async function saveRecord(payload) {
    const optionalKeys = ['num_red_bags', 'price_per_red_bag', 'loose_kg_sold', 'sale_time']
    let attempt = { ...payload }

    for (let tries = 0; tries <= optionalKeys.length; tries += 1) {
      const result = initialData?.id
        ? await supabase.from('income').update(attempt).eq('id', initialData.id)
        : await supabase.from('income').insert([attempt])

      if (!result.error) return
      if (!isMissingColumnError(result.error)) throw result.error

      attempt = omitKeys(attempt, optionalKeys)
    }

    throw new Error('Could not save sale.')
  }

  async function saveSplitCombinedSale(shared, bagSale, kgSale, formData) {
    await saveRecord({
      ...shared,
      num_red_bags: bagSale.bags,
      price_per_red_bag: parseFloat(formData.price_per_red_bag),
      kg_sold: bagSale.kgSold,
      price_per_kg: bagSale.pricePerKg,
    })
    await saveRecord({
      ...shared,
      num_red_bags: 0,
      price_per_red_bag: 0,
      kg_sold: kgSale.kgSold,
      price_per_kg: parseFloat(formData.price_per_kg),
    })
  }

  async function saveNewSale(shared, combinedSale, bagSale, kgSale, formData) {
    if (combinedSale.isCombined) {
      const payload = {
        ...shared,
        num_red_bags: bagSale.bags,
        price_per_red_bag: parseFloat(formData.price_per_red_bag),
        loose_kg_sold: kgSale.kgSold,
        price_per_kg: parseFloat(formData.price_per_kg),
        kg_sold: combinedSale.totalKgSold,
      }

      const result = await supabase.from('income').insert([payload])
      if (!result.error) return
      if (isMissingColumnError(result.error)) {
        await saveSplitCombinedSale(shared, bagSale, kgSale, formData)
        return
      }
      throw result.error
    }

    if (combinedSale.hasBags) {
      await saveRecord({
        ...shared,
        num_red_bags: bagSale.bags,
        price_per_red_bag: parseFloat(formData.price_per_red_bag),
        loose_kg_sold: 0,
        kg_sold: bagSale.kgSold,
        price_per_kg: bagSale.pricePerKg,
      })
      return
    }

    await saveRecord({
      ...shared,
      num_red_bags: 0,
      price_per_red_bag: 0,
      loose_kg_sold: 0,
      kg_sold: kgSale.kgSold,
      price_per_kg: parseFloat(formData.price_per_kg),
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      toast.error('You must be logged in to save entries.')
      return
    }

    setLoading(true)
    try {
      const shared = {
        user_id: user.id,
        date: formData.date,
        sale_time: formData.sale_time ? `${formData.sale_time}:00` : null,
        buyer: formData.buyer.trim(),
        harvest_id: formData.harvest_id || null,
        notes: formData.notes.trim(),
      }

      if (isEditing) {
        const validation = validateSaleInventory({
          harvestId: formData.harvest_id,
          harvests,
          inventory,
          requireBatch: harvests.length > 0,
          pendingKg,
          pendingLooseKg: editingKgOnly || editingCombined ? kgSale.kgSold : 0,
          pendingBagKg: editingBagOnly || editingCombined ? bagSale.kgSold : 0,
          saleMode: editingCombined ? 'combined' : editingBagOnly ? 'bag' : 'kg',
        })
        if (!validation.ok) {
          toast.error(validation.message)
          setLoading(false)
          return
        }

        if (editingCombined) {
          const pricePerRedBagVal = parseFloat(formData.price_per_red_bag)
          const pricePerKgVal = parseFloat(formData.price_per_kg)
          if (!pricePerRedBagVal || !pricePerKgVal) {
            toast.error('Enter prices for both bags and loose kilos.')
            setLoading(false)
            return
          }
          await saveRecord({
            ...shared,
            num_red_bags: bagSale.bags,
            price_per_red_bag: pricePerRedBagVal,
            loose_kg_sold: kgSale.kgSold,
            price_per_kg: pricePerKgVal,
            kg_sold: combinedSale.totalKgSold,
          })
        } else if (editingBagOnly) {
          const numRedBagsVal = parseFloat(formData.num_red_bags)
          const pricePerRedBagVal = parseFloat(formData.price_per_red_bag)
          if (!numRedBagsVal || numRedBagsVal <= 0 || !pricePerRedBagVal || pricePerRedBagVal <= 0) {
            toast.error('Enter bags sold and price per bag.')
            setLoading(false)
            return
          }
          await saveRecord({
            ...shared,
            num_red_bags: numRedBagsVal,
            price_per_red_bag: pricePerRedBagVal,
            loose_kg_sold: 0,
            kg_sold: bagSale.kgSold,
            price_per_kg: bagSale.pricePerKg,
          })
        } else {
          const looseKgVal = parseFloat(formData.loose_kg)
          const pricePerKgVal = parseFloat(formData.price_per_kg)
          if (!looseKgVal || looseKgVal <= 0 || !pricePerKgVal || pricePerKgVal <= 0) {
            toast.error('Enter loose kilos sold and price per kg.')
            setLoading(false)
            return
          }
          await saveRecord({
            ...shared,
            num_red_bags: 0,
            price_per_red_bag: 0,
            loose_kg_sold: 0,
            kg_sold: looseKgVal,
            price_per_kg: pricePerKgVal,
          })
        }
      } else {
        if (!combinedSale.hasBags && !combinedSale.hasLoose) {
          toast.error('Enter bags sold and/or loose kilos sold.')
          setLoading(false)
          return
        }

        const validation = validateSaleInventory({
          harvestId: formData.harvest_id,
          harvests,
          inventory,
          requireBatch: harvests.length > 0,
          pendingKg,
          pendingBagKg: bagSale.kgSold,
          pendingLooseKg: kgSale.kgSold,
          saleMode: 'combined',
        })
        if (!validation.ok) {
          toast.error(validation.message)
          setLoading(false)
          return
        }

        if (combinedSale.hasBags) {
          const pricePerRedBagVal = parseFloat(formData.price_per_red_bag)
          if (!pricePerRedBagVal || pricePerRedBagVal <= 0) {
            toast.error('Enter the price per bag.')
            setLoading(false)
            return
          }
        }

        if (combinedSale.hasLoose) {
          const pricePerKgVal = parseFloat(formData.price_per_kg)
          if (!pricePerKgVal || pricePerKgVal <= 0) {
            toast.error('Enter the price per kg for loose kilos.')
            setLoading(false)
            return
          }
        }

        await saveNewSale(shared, combinedSale, bagSale, kgSale, formData)
      }

      toast.success(initialData?.id ? 'Sale updated' : 'Sale recorded')
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Failed to save income.')
    } finally {
      setLoading(false)
    }
  }

  const showBagSection = !isEditing || editingBagOnly || editingCombined
  const showKgSection = !isEditing || editingKgOnly || editingCombined

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-1">
      <FormSection>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="field-label">Sale date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="field-input"
            />
          </div>
          <div className="min-w-0">
            <label className="field-label">Sale time</label>
            <input
              type="time"
              required
              value={formData.sale_time}
              onChange={(e) => setFormData({ ...formData, sale_time: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
        <div className="mt-3">
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
        {!isEditing && profile && (
          <p className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
            Will be logged by <span className="font-medium text-slate-300">{formatUserLabel(profile)}</span>
          </p>
        )}
        {isEditing && initialData?.created_at && (
          <p className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
            Logged {formatDateTime(initialData.created_at)} by{' '}
            <span className="font-medium text-slate-300">{formatUserLabel(profileMap[initialData.user_id])}</span>
          </p>
        )}
      </FormSection>

      {harvests.length > 0 && (
        <FormSection title="Harvest batch" description="Choose which picking batch this sale comes from">
          <select
            required
            value={formData.harvest_id}
            onChange={(e) => handleHarvestChange(e.target.value)}
            className="field-input"
          >
            <option value="">Choose a batch…</option>
            {harvests.map((h) => {
              const batchInventory = getHarvestInventory(h, linkedSales, initialData?.id)
              const hasRemaining = batchInventory.availableKg > 0.001
              if (!hasRemaining && !isEditing) return null
              return (
                <option key={h.id} value={h.id}>
                  {formatBatchOptionLabel(h, batchInventory.availableKg)}
                </option>
              )
            })}
          </select>
          {selectedHarvest && inventory && (
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Picked <span className="text-slate-300">{formatDate(selectedHarvest.date)}</span>
              {' · '}
              {formatHarvestRedBags(selectedHarvest)} harvested
              {' · '}
              <span className="text-[#d7ffe0]/80">{formatWeight(inventory.availableKg)} left</span>
            </p>
          )}
          {inventory && (
            <div className="mt-3">
              <InventorySummary compact items={inventoryItems(inventory, pendingKg)} />
            </div>
          )}
        </FormSection>
      )}

      {!isEditing && harvests.length > 0 && harvests.every((h) => getHarvestInventory(h, linkedSales, initialData?.id).availableKg <= 0.001) && (
        <ComputedHint>No harvest batches with stock left. Log a new harvest first.</ComputedHint>
      )}

      {!isEditing && harvests.some((h) => getHarvestInventory(h, linkedSales, initialData?.id).availableKg > 0.001) && (
        <ComputedHint>
          Enter whole bags and loose kilos together — one Save sale records both parts.
        </ComputedHint>
      )}

      {showBagSection && (
        <FormSection title="Sold by bag" description={`1 bag = ${RED_BAG_KG} kg · optional if selling loose only`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Bags sold</label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={formData.num_red_bags}
                onChange={(e) => setFormData({ ...formData, num_red_bags: e.target.value })}
                className="field-input"
              />
              {inventory && (
                <ComputedHint>
                  Up to {inventory.maxWholeBags} whole {inventory.maxWholeBags === 1 ? 'bag' : 'bags'} (
                  {formatWeight(inventory.maxWholeBags * RED_BAG_KG)})
                </ComputedHint>
              )}
            </div>
            <div>
              <label className="field-label">Price / bag (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
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
              {formatBags(bagSale.bags)} = {formatWeight(bagSale.kgSold)} · {formatCurrency(bagSale.income)}
            </ComputedHint>
          )}
        </FormSection>
      )}

      {showKgSection && (
        <FormSection title="Sold by kilo" description={`Loose weight · optional if selling bags only`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">Loose kilos sold</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={inventory ? Math.max(looseKgAvailable, 0) : undefined}
                placeholder="0"
                value={formData.loose_kg}
                onChange={(e) => setFormData({ ...formData, loose_kg: e.target.value })}
                className="field-input"
              />
              {inventory && looseKgAvailable > 0 && (
                <ComputedHint>
                  Max {formatWeight(looseKgAvailable)} loose · {formatRedBagTotal(looseKgAvailable)}
                </ComputedHint>
              )}
              {kgSale.kgSold > 0 && (
                <ComputedHint>≈ {formatRedBagTotal(kgSale.kgSold)} at {RED_BAG_KG} kg/bag</ComputedHint>
              )}
            </div>
            <div>
              <label className="field-label">Price / kg (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
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

      {!isEditing && combinedSale.isCombined && (
        <div className="rounded-lg border border-[#d7ffe0]/10 bg-[#d7ffe0]/5 px-3 py-2.5 text-[11px] text-[#d7ffe0]/80">
          <p>
            {formatCurrency(combinedSale.bag.income)} bags + {formatCurrency(combinedSale.kg.income)} loose ={' '}
            <span className="font-semibold text-[#d7ffe0]">{formatCurrency(combinedSale.totalIncome)}</span>
          </p>
        </div>
      )}

      {!isEditing && combinedSale.totalKgSold > 0 && !combinedSale.isCombined && (
        <ComputedHint>
          Total this sale: {formatWeight(combinedSale.totalKgSold)} · {formatRedBagTotal(combinedSale.totalKgSold)}
        </ComputedHint>
      )}

      {!isEditing && combinedSale.isCombined && (
        <ComputedHint>
          Total this sale: {formatWeight(combinedSale.totalKgSold)} · {formatRedBagTotal(combinedSale.totalKgSold)}
        </ComputedHint>
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
