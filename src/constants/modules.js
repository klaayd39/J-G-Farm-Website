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
    description: 'Track bottle sales and box expenses by size for the juice line.',
    to: '/juice/sales',
    icon: GlassWater,
    status: 'active',
    accent: 'amber',
  },
  {
    id: 'silage',
    title: 'Super Napier Silage',
    description: 'Track silage harvest batches, sales, and field expenses.',
    to: '/silage/harvests',
    icon: Wheat,
    status: 'active',
    accent: 'blue',
  },
]

export const MODULE_SELECT_PATH = '/select'
