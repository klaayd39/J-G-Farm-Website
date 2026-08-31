import { GlassWater } from 'lucide-react'
import { ModulePlaceholderLayout } from '../components/layout/ModulePlaceholderLayout'
import { EmptyState } from '../components/ui/EmptyState'

export function Juice() {
  return (
    <ModulePlaceholderLayout eyebrow="Production Module" title="Calamansi Juice">
      <EmptyState
        icon={GlassWater}
        title="Coming Soon"
        description="Calamansi juice production, inventory, and sales tracking will be available in a future update."
      />
    </ModulePlaceholderLayout>
  )
}
