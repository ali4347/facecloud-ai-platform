import { Link } from 'react-router-dom'
import { Eye, FileImage } from 'lucide-react'
import { getImageThumbnail, type BatchProgress } from '../../lib/api/images'
import { AuthedImage } from '../ui/AuthedImage'
import { statusLabel } from '../../lib/imageData'
import { uploadStatusBadge } from '../ui/StatusBadge'

/**
 * One row per photo of an upload, from the server's own progress (`progress.images`): the file name, and while it is being worked on its stage and percentage, afterwards the
 * final status and a link to the photo. The ZIP screen has no list of photos of its own (the files are inside the archive), so this is what shows each of them, as the
 * several-photos screen does for the files the person picked.
 */
export function BatchPhotoRows({ progress, done }: { progress: BatchProgress | null; done: boolean }) {
  const rows = progress?.images ?? []
  if (rows.length === 0) {
    return <p className="text-xs text-ink-mute py-6 text-center">{done ? 'No photos were found in this archive.' : 'Reading the archive…'}</p>
  }
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {rows.map(row => {
        const settled = done || row.progress_percentage >= 100 || ['completed', 'rejected', 'failed', 'needs_review', 'accepted'].includes(row.status)
        return (
          <div key={row.image_id} className="p-4 rounded-2xl bg-surface-mute border border-line flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              {row.has_preview ? (
                <AuthedImage load={signal => getImageThumbnail(row.image_id, 256, signal)} cacheKey={`batch-row-${row.image_id}`} alt={row.filename} box={36} className="rounded-lg shrink-0" />
              ) : (
                <div className="p-2 rounded-xl bg-surface-mute border border-line text-ink-mute shrink-0" title="This file was not kept, so there is no preview."><FileImage className="w-4 h-4" /></div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-ink truncate max-w-[220px]" title={row.filename}>{row.filename}</p>
                {row.failure_reason && <p className="text-[10px] text-[#F87171] mt-0.5">{row.failure_reason}</p>}
              </div>
            </div>
            <div className="shrink-0">
              {settled ? (
                <div className="flex items-center gap-2">
                  {uploadStatusBadge(row.status)}
                  {row.has_preview !== false && row.status !== 'failed' && (
                    <Link to={`/dashboard/images/${row.image_id}`} aria-label={`Details for ${row.filename}`} className="text-ink-mute hover:text-ink"><Eye className="w-3.5 h-3.5" /></Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-accent font-bold text-[10px]">{statusLabel(row.status)} · {row.progress_percentage}%</span>
                  <div className="w-16 h-1 bg-surface-mute rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all" style={{ width: `${row.progress_percentage}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
