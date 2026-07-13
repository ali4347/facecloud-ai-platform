import { Download, FileImage, FolderArchive, Camera } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { mockDownloads } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'

const typeConfig = {
  single:   { icon: FileImage,     label: 'Single Image', badge: 'info' as const },
  batch:    { icon: FolderArchive, label: 'Batch ZIP',    badge: 'purple' as const },
  snapshot: { icon: Camera,        label: 'Live Snapshot', badge: 'success' as const },
  report:   { icon: FileImage,     label: 'Audit Report',  badge: 'success' as const },
}

export default function Downloads() {
  return (
    <div className="page-enter">
      <PageHeader
        title="Downloads"
        subtitle="Download your enhanced images individually, in batches, or as live snapshots."
        action={
          <GradientButton leftIcon={<Download className="w-4 h-4" />} variant="secondary">
            Download All (ZIP)
          </GradientButton>
        }
      />

      <div className="fc-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <h3 className="text-sm font-semibold text-white">Download History</h3>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {mockDownloads.map(dl => {
            const cfg = typeConfig[dl.type]
            return (
              <div key={dl.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,132,255,0.10)', border: '1px solid rgba(0,132,255,0.20)' }}
                >
                  <cfg.icon className="w-4 h-4 text-[#60B1FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{dl.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-white/40">{dl.size}</span>
                    {dl.imageCount && <span className="text-xs text-white/40">{dl.imageCount} images</span>}
                    <span className="text-xs text-white/40 font-mono">{formatDateTime(dl.downloadedAt)}</span>
                  </div>
                </div>
                <StatusBadge status={cfg.badge} label={cfg.label} dot={false} />
                <GradientButton variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download
                </GradientButton>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
