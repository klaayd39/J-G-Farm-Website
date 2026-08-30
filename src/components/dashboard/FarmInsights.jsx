import { formatCurrency, formatDate, formatWeight } from '../../utils/formatters'
import { formatRedBagTotal } from '../../utils/farmUnits'
import { Panel } from '../ui/Panel'

function Delta({ current, previous }) {
  if (previous <= 0 && current <= 0) return <span className="text-slate-500">No prior data</span>
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 100
  const positive = change >= 0
  return (
    <span className={positive ? 'text-emerald-300' : 'text-rose-300'}>
      {positive ? '+' : ''}
      {change.toFixed(1)}% vs last year
    </span>
  )
}

export function FarmInsights({
  inventory,
  buyers,
  seasonal,
  labor,
  lowStock,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
      <Panel title="Inventory overview" description="Harvested vs sold across all batches">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Harvested</p>
            <p className="mt-1 font-display text-lg font-semibold text-white">{formatRedBagTotal(inventory.totalHarvestKg)}</p>
            <p className="text-xs text-slate-400">{formatWeight(inventory.totalHarvestKg)}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sold</p>
            <p className="mt-1 font-display text-lg font-semibold text-sky-300">{formatRedBagTotal(inventory.totalSoldKg)}</p>
            <p className="text-xs text-slate-400">{formatWeight(inventory.totalSoldKg)}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Remaining</p>
            <p className="mt-1 font-display text-lg font-semibold text-emerald-300">{formatRedBagTotal(inventory.remainingKg)}</p>
            <p className="text-xs text-slate-400">{formatWeight(inventory.remainingKg)}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Seasonal comparison" description={`${seasonal.monthLabel} vs same month last year`}>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Revenue</span>
            <div className="text-right">
              <p className="font-semibold text-white">{formatCurrency(seasonal.income.current)}</p>
              <p className="text-xs"><Delta current={seasonal.income.current} previous={seasonal.income.previous} /></p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Expenses</span>
            <div className="text-right">
              <p className="font-semibold text-white">{formatCurrency(seasonal.expense.current)}</p>
              <p className="text-xs"><Delta current={seasonal.expense.current} previous={seasonal.expense.previous} /></p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Harvest volume</span>
            <div className="text-right">
              <p className="font-semibold text-white">{formatWeight(seasonal.harvestKg.current)}</p>
              <p className="text-xs"><Delta current={seasonal.harvestKg.current} previous={seasonal.harvestKg.previous} /></p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Top buyers" description="Highest revenue buyers in selected period">
        {buyers.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No buyer sales in this period.</p>
        ) : (
          <div className="space-y-2">
            {buyers.map((buyer) => (
              <div key={buyer.buyer} className="flex items-center justify-between rounded-xl border border-white/6 px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-white">{buyer.buyer}</p>
                  <p className="text-xs text-slate-400">{buyer.salesCount} sales · {formatWeight(buyer.kgSold)}</p>
                </div>
                <p className="font-semibold text-emerald-300">{formatCurrency(buyer.revenue)}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Labor efficiency" description="Labor spend relative to harvest volume">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Labor cost</p>
            <p className="mt-1 font-semibold text-rose-300">{formatCurrency(labor.laborExpenses)}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cost / kg</p>
            <p className="mt-1 font-semibold text-white">
              {labor.costPerKg != null ? formatCurrency(labor.costPerKg) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Harvesters logged</p>
            <p className="mt-1 font-semibold text-white">{labor.totalHarvesters || '—'}</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Kg / harvester</p>
            <p className="mt-1 font-semibold text-white">
              {labor.kgPerHarvester != null ? formatWeight(labor.kgPerHarvester) : '—'}
            </p>
          </div>
        </div>
      </Panel>

      {lowStock.length > 0 && (
        <Panel className="xl:col-span-2" title="Low stock alerts" description="Batches with 5 bags or less remaining">
          <div className="flex flex-wrap gap-2">
            {lowStock.map(({ harvest, remainingKg }) => (
              <div
                key={harvest.id}
                className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
              >
                <span className="font-semibold text-white">{formatDate(harvest.date)}</span>
                <span className="mx-1.5 text-amber-300/70">·</span>
                {formatRedBagTotal(remainingKg)} left ({formatWeight(remainingKg)})
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
