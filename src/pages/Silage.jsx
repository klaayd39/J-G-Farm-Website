import { Wheat } from 'lucide-react'
import { ModulePlaceholderLayout } from '../components/layout/ModulePlaceholderLayout'
import { EmptyState } from '../components/ui/EmptyState'

export function Silage() {
  return (
    <ModulePlaceholderLayout eyebrow="Forage Module" title="Super Napier Silage">
      <EmptyState
        icon={Wheat}
        title="Coming Soon"
        description="Super Napier silage harvest, storage, and dispatch tools will be available in a future update."
      />
    </ModulePlaceholderLayout>
  )
}
