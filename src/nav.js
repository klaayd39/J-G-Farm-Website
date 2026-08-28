import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Trees,
  FileBarChart,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/income', label: 'Income', icon: TrendingUp },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/harvests', label: 'Harvests', icon: Trees },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
]
