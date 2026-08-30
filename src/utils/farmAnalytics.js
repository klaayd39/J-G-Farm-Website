import { subYears, format } from 'date-fns'
import { formatMonthYear, formatCurrency, formatWeight } from './formatters'
import { getHarvestInventory, getHarvestKg, kgToBags, isCombinedIncomeSale } from './farmUnits'

export function buildMonthlyChartData(incomeData, expenseData) {
  const map = {}
  incomeData.forEach((inc) => {
    const month = inc.date ? inc.date.substring(0, 7) : 'Unknown'
    if (!map[month]) map[month] = { period: month, periodLabel: formatMonthYear(`${month}-01`), income: 0, expense: 0 }
    map[month].income += Number(inc.total_amount || 0)
  })

  expenseData.forEach((exp) => {
    const month = exp.date ? exp.date.substring(0, 7) : 'Unknown'
    if (!map[month]) map[month] = { period: month, periodLabel: formatMonthYear(`${month}-01`), income: 0, expense: 0 }
    map[month].expense += Number(exp.amount || 0)
  })

  return Object.values(map)
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(({ periodLabel, income, expense }) => ({ period: periodLabel, income, expense }))
}

export function buildCategoryChartData(expenseData) {
  const map = {}
  expenseData.forEach((exp) => {
    const cat = exp.category || 'other'
    map[cat] = (map[cat] || 0) + Number(exp.amount || 0)
  })
  return Object.entries(map).map(([category, amount]) => ({ category, amount }))
}

export function buildInventorySummary(harvests, linkedSales) {
  let totalHarvestKg = 0
  let totalSoldKg = 0

  harvests.forEach((harvest) => {
    const inv = getHarvestInventory(harvest, linkedSales)
    totalHarvestKg += inv.harvestKg
    totalSoldKg += inv.soldKg
  })

  const remainingKg = totalHarvestKg - totalSoldKg

  return {
    totalHarvestKg,
    totalSoldKg,
    remainingKg,
    totalHarvestBags: kgToBags(totalHarvestKg),
    totalSoldBags: kgToBags(totalSoldKg),
    remainingBags: kgToBags(remainingKg),
  }
}

export function getLowStockBatches(harvests, linkedSales, thresholdBags = 5) {
  return harvests
    .map((harvest) => {
      const inv = getHarvestInventory(harvest, linkedSales)
      return { harvest, ...inv }
    })
    .filter((item) => item.remainingKg > 0 && item.remainingBags <= thresholdBags)
    .sort((a, b) => a.remainingBags - b.remainingBags)
}

export function buildBuyerAnalytics(incomeData) {
  const map = {}
  incomeData.forEach((sale) => {
    const buyer = sale.buyer?.trim() || 'Unknown'
    if (!map[buyer]) {
      map[buyer] = { buyer, revenue: 0, kgSold: 0, salesCount: 0 }
    }
    map[buyer].revenue += Number(sale.total_amount || 0)
    map[buyer].kgSold += Number(sale.kg_sold || 0)
    map[buyer].salesCount += 1
  })

  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

export function buildLaborMetrics(harvestData, expenseData) {
  const laborExpenses = expenseData
    .filter((exp) => exp.category === 'labor')
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0)

  const totalHarvestKg = harvestData.reduce((sum, h) => sum + getHarvestKg(h), 0)
  const totalHarvesters = harvestData.reduce((sum, h) => sum + Number(h.num_harvesters || 0), 0)

  return {
    laborExpenses,
    totalHarvestKg,
    totalHarvesters,
    costPerKg: totalHarvestKg > 0 ? laborExpenses / totalHarvestKg : null,
    kgPerHarvester: totalHarvesters > 0 ? totalHarvestKg / totalHarvesters : null,
  }
}

export function buildSeasonalComparison(incomeData, expenseData, harvestData) {
  const now = new Date()
  const thisMonthKey = format(now, 'yyyy-MM')
  const lastYearMonthKey = format(subYears(now, 1), 'yyyy-MM')

  function sumForMonth(data, amountKey, monthKey) {
    return data
      .filter((row) => row.date?.startsWith(monthKey))
      .reduce((sum, row) => sum + Number(row[amountKey] || 0), 0)
  }

  const thisIncome = sumForMonth(incomeData, 'total_amount', thisMonthKey)
  const lastIncome = sumForMonth(incomeData, 'total_amount', lastYearMonthKey)
  const thisExpense = sumForMonth(expenseData, 'amount', thisMonthKey)
  const lastExpense = sumForMonth(expenseData, 'amount', lastYearMonthKey)
  const thisHarvest = harvestData
    .filter((row) => row.date?.startsWith(thisMonthKey))
    .reduce((sum, row) => sum + getHarvestKg(row), 0)
  const lastHarvest = harvestData
    .filter((row) => row.date?.startsWith(lastYearMonthKey))
    .reduce((sum, row) => sum + getHarvestKg(row), 0)

  return {
    monthLabel: formatMonthYear(`${thisMonthKey}-01`),
    income: { current: thisIncome, previous: lastIncome },
    expense: { current: thisExpense, previous: lastExpense },
    harvestKg: { current: thisHarvest, previous: lastHarvest },
  }
}

export function formatSaleSubtitle(sale) {
  if (isCombinedIncomeSale(sale)) {
    return `${sale.num_red_bags} bags @ ${formatCurrency(sale.price_per_red_bag)}/bag + ${formatWeight(sale.loose_kg_sold)} @ ${formatCurrency(sale.price_per_kg)}/kg`
  }
  if (Number(sale.num_red_bags) > 0) {
    return `${sale.num_red_bags} bags @ ${formatCurrency(sale.price_per_red_bag)}/bag · ${formatWeight(sale.kg_sold)}`
  }
  return `${formatWeight(sale.kg_sold)} @ ${formatCurrency(sale.price_per_kg)}/kg`
}

export function formatIncomeExportDetails(sale) {
  if (isCombinedIncomeSale(sale)) {
    return `${sale.num_red_bags} bags × ${formatCurrency(sale.price_per_red_bag)}/bag + ${sale.loose_kg_sold} kg × ${formatCurrency(sale.price_per_kg)}/kg`
  }
  if (Number(sale.num_red_bags) > 0) {
    return `${sale.num_red_bags} bags × ${formatCurrency(sale.price_per_red_bag)}/bag`
  }
  return `${sale.kg_sold} kg × ${formatCurrency(sale.price_per_kg)}/kg`
}
