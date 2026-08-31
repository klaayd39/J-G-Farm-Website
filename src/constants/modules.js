import { Trees, GlassWater, Wheat } from 'lucide-react'

export const MODULES = [
  {
    id: 'harvest',
    title: 'Calamansi Harvest',
    description: 'Track picking batches, market sales, expenses, and orchard profitability.',
    to: '/',
    icon: Trees,
    status: 'active',
    accent: 'emerald',
  },
  {
    id: 'juice',
    title: 'Calamansi Juice',
    description: 'Production, inventory, and sales for calamansi juice operations.',
    to: '/juice',
    icon: GlassWater,
    status: 'coming-soon',
    accent: 'amber',
  },
  {
    id: 'silage',
    title: 'Super Napier Silage',
    description: 'Track silage harvest batches and sales by bags and cuttings.',
    to: '/silage/harvests',
    icon: Wheat,
    status: 'active',
    accent: 'blue',
  },
]

export const MODULE_SELECT_PATH = '/select'
