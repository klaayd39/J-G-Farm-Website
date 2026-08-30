import {
  LayoutDashboard,
  TrendingUp,
  PhilippinePeso,
  Trees,
  FileBarChart,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/harvests', label: 'Harvests', icon: Trees },
  { to: '/expenses', label: 'Expenses', icon: PhilippinePeso },
  { to: '/income', label: 'Income', icon: TrendingUp },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
]

