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
    description: 'Harvest, storage, and dispatch for Super Napier silage production.',
    to: '/silage',
    icon: Wheat,
    status: 'coming-soon',
    accent: 'blue',
  },
]

export const MODULE_SELECT_PATH = '/select'
