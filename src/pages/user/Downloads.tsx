import { useState } from 'react'
import { Download, FileImage, FolderArchive, Camera, Copy, Check, Clock } from 'lucide-react'
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

function expiryDisplay(expiryDateStr: string): { label: string; urgent: boolean } {
  const diff = new Date(expiryDateStr).getTime() - Date.now()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (diff < 0) return { label: 'Link expired', urgent: true }
  if (hours < 2) return { label: `Expires in ${Math.max(hours, 1)} hr`, urgent: true }
  if (hours < 24) return { label: `Expires in ${hours} hrs`, urgent: true }
  return { label: `Valid for ${days} day${days !== 1 ? 's' : ''}`, urgent: false }
}

export default function Downloads() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Downloads"
        subtitle="Your enhanced photos with secure, time-limited download links."
        action={
          <GradientButton leftIcon={<Download className="w-4 h-4" />} variant="secondary">
            Download All (ZIP)
          </GradientButton>
        }
      />

      {/* Summary bar */}
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-xs font-medium text-ink-mute"
        style={{ background: 'rgb(var(--a-surface-mute))', border: '1px solid rgb(var(--a-line))' }}
      >
        <Clock className="w-4 h-4 text-[#FB923C] shrink-0" />
        <span>All download links are secure and time-limited. Copy a link to share or re-download from any device.</span>
      </div>

      <div className="fc-card overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Download History</h3>
          <span className="text-[10px] text-ink-faint font-medium">{mockDownloads.length} item{mockDownloads.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-line">
          {mockDownloads.map(dl => {
            const cfg = typeConfig[dl.type]
            const expiry = expiryDisplay(dl.expiryDate)
            const copied = copiedId === dl.id
            return (
              <div key={dl.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-mute transition-colors">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.20)' }}
                >
                  <cfg.icon className="w-4 h-4 text-[#FB923C]" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{dl.name}</p>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-ink-faint">{dl.size}</span>
                    {dl.imageCount && <span className="text-xs text-ink-faint">{dl.imageCount} photos</span>}
                    <span className="text-xs text-ink-faint font-mono">{formatDateTime(dl.downloadedAt)}</span>
                    {/* Expiry badge */}
                    <span
                      className="text-[10px] font-bold flex items-center gap-1"
                      style={{ color: expiry.urgent ? '#F59E0B' : '#10B981' }}
                    >
                      <Clock className="w-3 h-3" />
                      {expiry.label}
                    </span>
                  </div>
                </div>

                <StatusBadge status={cfg.badge} label={cfg.label} dot={false} />

                {/* Copy link button */}
                <button
                  onClick={() => copyLink(dl.id, dl.secureLink)}
                  className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0"
                  style={{
                    borderColor: copied ? 'rgba(16,185,129,0.4)' : 'rgb(var(--a-line))',
                    background: copied ? 'rgba(16,185,129,0.06)' : 'rgb(var(--a-surface-mute))',
                    color: copied ? '#10B981' : 'rgb(var(--a-ink-faint))',
                  }}
                  title="Copy secure link"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <GradientButton
                  variant="secondary"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download
                </GradientButton>
              </div>
            )
          })}
        </div>

        {mockDownloads.length === 0 && (
          <div className="px-5 py-16 text-center text-ink-faint">
            <Download className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No downloads yet.</p>
            <p className="text-xs mt-1">Upload and process photos to get download links.</p>
          </div>
        )}
      </div>
    </div>
  )
}
