import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { Button } from './Button'

export function SizeLineEditor({
  lines,
  onChange,
  sizePresets = [],
  quantityLabel,
  priceLabel,
  sizeLabel = 'Size',
}) {
  function updateLine(index, field, value) {
    onChange(lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  function addLine() {
    onChange([...lines, { size: '', quantity: '', price_per_unit: '' }])
  }

  function removeLine(index) {
    if (lines.length === 1) {
      onChange([{ size: '', quantity: '', price_per_unit: '' }])
      return
    }
    onChange(lines.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {lines.map((line, index) => {
          const qty = Number(line.quantity || 0)
          const price = Number(line.price_per_unit || 0)
          const subtotal = qty > 0 && price > 0 ? qty * price : 0

          return (
            <div key={index} className="rounded-xl border border-app bg-app-hover p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                  Line {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="rounded-lg p-1.5 text-app-secondary hover:bg-rose-500/10 hover:text-rose-400"
                  aria-label="Remove line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="field-label">{sizeLabel}</label>
                  <input
                    type="text"
                    list={sizePresets.length > 0 ? `size-presets-${quantityLabel}` : undefined}
                    placeholder="e.g. 350ml"
                    value={line.size}
                    onChange={(e) => updateLine(index, 'size', e.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">{quantityLabel}</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <label className="field-label">{priceLabel}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={line.price_per_unit}
                    onChange={(e) => updateLine(index, 'price_per_unit', e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>
              {subtotal > 0 && (
                <p className="mt-2 text-[11px] font-medium tabular-nums text-app-secondary">
                  Subtotal: {formatCurrency(subtotal)}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {sizePresets.length > 0 && (
        <datalist id={`size-presets-${quantityLabel}`}>
          {sizePresets.map((preset) => (
            <option key={preset} value={preset} />
          ))}
        </datalist>
      )}

      <Button type="button" variant="secondary" onClick={addLine} className="w-full sm:w-auto">
        <Plus size={15} />
        Add size
      </Button>
    </div>
  )
}
