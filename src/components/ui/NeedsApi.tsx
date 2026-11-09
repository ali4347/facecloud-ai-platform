import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '../layout/PageHeader'
import { EmptyState } from './EmptyState'
import { USE_API } from '../../lib/api/config'

/**
 * A screen that only means something against the real backend (albums, trash, places...). In the offline demo build it says so instead of
 * showing an empty page; connected, it shows its content.
 */
export function NeedsApi({ title, icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  if (USE_API) return <>{children}</>
  return (
    <div className="page-enter">
      <PageHeader title={title} />
      <div className="fc-card">
        <EmptyState icon={icon} title="This needs the connected app" description="It works with the real server. Set VITE_USE_API=true and VITE_API_URL to use it." />
      </div>
    </div>
  )
}
