import { useState } from 'react'
import { AlertTriangle, CheckCircle, GitMerge, MoveRight, Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ModeratorGate } from '../../components/moderator/ModeratorGate'
import { getPreview, listIdentityFolders, listMergeSuggestions, mergeFolders, type IdentityFolder, type MergeSuggestion } from '../../lib/api/moderatorConsole'
import { useModeratorOrganization, useModeratorResource } from '../../lib/moderationData'
import { messageFor } from '../../lib/useApiResource'

function Covers({ folder, size = 36 }: { folder: IdentityFolder; size?: number }) {
  return (
    <div className="flex gap-1">
      {folder.cover_images.slice(0, 3).map(c => (
        <AuthedImage key={c.id} load={signal => getPreview(c.preview_url, signal)} cacheKey={`cover-${c.id}`} alt="" box={size} rounded="rounded-lg" />
      ))}
      {folder.cover_images.length === 0 && <div className="rounded-lg bg-surface-mute border border-line flex items-center justify-center" style={{ width: size, height: size }}><Users className="w-4 h-4 text-ink-faint" /></div>}
    </div>
  )
}

export function LiveIdentityReview() {
  const { organizationId } = useModeratorOrganization()
  const state = useModeratorResource(
    async (org, signal) => {
      const [folders, suggestions] = await Promise.all([listIdentityFolders(org, signal), listMergeSuggestions(org, signal)])
      return { folders, suggestions }
    },
    () => ({ folders: [] as IdentityFolder[], suggestions: [] as MergeSuggestion[] }),
    [],
  )
  // "Dismiss" is this browser's choice only: the backend stores nothing about it, and recomputes suggestions each time.
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [merging, setMerging] = useState<MergeSuggestion | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null)
  const say = (text: string, bad = false) => { setToast({ text, bad }); setTimeout(() => setToast(null), 4000) }
  const keyOf = (s: MergeSuggestion) => `${s.source.id}-${s.target.id}`

  const merge = async () => {
    if (!merging || organizationId === null) return
    setBusy(true); setFormError(null)
    try {
      await mergeFolders(organizationId, merging.source.id, merging.target.id, reason.trim())
      say(`${merging.source.display_name} was merged into ${merging.target.display_name}.`)
      setMerging(null); state.reload()
    } catch (caught) { setFormError(messageFor(caught)) } finally { setBusy(false) }
  }

  return (
    <div className="relative">
      {toast && (
        <div role="status" className={`fixed top-6 right-6 z-50 p-4 rounded-3xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
          toast.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'}`}>
          {toast.bad ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}<span>{toast.text}</span>
        </div>
      )}
      <PageHeader title="Identity Review" subtitle="Person folders that hold photos submitted to your organization. You can merge two folders of the same member." />

      <ModeratorGate state={state} what="the person folders">
        {({ folders, suggestions }) => {
          const visible = suggestions.filter(s => !dismissed.has(keyOf(s)))
          return (
            <>
              <div className="fc-card p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <GitMerge className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold text-ink">Suggested folder merges</h2>
                  {visible.length > 0 && <StatusBadge status="warning" label={`${visible.length} suggestion${visible.length === 1 ? '' : 's'}`} dot={false} />}
                </div>
                {visible.length === 0 ? (
                  <p className="text-xs text-ink-faint py-2">{suggestions.length > 0 ? 'You dismissed every suggestion. They come back when you reload.' : 'No two folders of one member look alike enough to suggest a merge.'}</p>
                ) : (
                  <div className="space-y-3">
                    {visible.map(s => (
                      <div key={keyOf(s)} className="flex flex-wrap items-center gap-4 p-3 bg-surface-mute rounded-2xl border border-line">
                        <div className="flex items-center gap-3"><Covers folder={s.source} size={32} /><div><p className="text-sm font-semibold text-ink">{s.source.display_name}</p><p className="text-[10px] text-ink-faint">{s.source.member_count} photo{s.source.member_count === 1 ? '' : 's'} · {s.source.owner.username}</p></div></div>
                        <div className="flex items-center gap-2"><MoveRight className="w-4 h-4 text-ink-mute" /><span className="px-2 py-0.5 bg-amber-100 text-warning text-xs font-bold rounded-full">{Math.round(s.similarity)}% alike</span><MoveRight className="w-4 h-4 text-ink-mute" /></div>
                        <div className="flex items-center gap-3"><Covers folder={s.target} size={32} /><div><p className="text-sm font-semibold text-ink">{s.target.display_name}</p><p className="text-[10px] text-ink-faint">{s.target.member_count} photo{s.target.member_count === 1 ? '' : 's'} · kept</p></div></div>
                        <div className="flex-1" />
                        <button type="button" onClick={() => { setReason(''); setFormError(null); setMerging(s) }} className="fc-btn-primary !py-2 !px-3 text-[11px] font-bold">Merge folders</button>
                        <button type="button" onClick={() => setDismissed(d => new Set(d).add(keyOf(s)))} className="fc-btn-secondary !py-2 !px-3 text-[11px] font-bold">Dismiss</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <h2 className="text-sm font-semibold text-ink mb-3">All person folders ({folders.length})</h2>
              {folders.length === 0 ? (
                <p className="text-xs text-ink-faint py-6">No person folders hold photos submitted to your organization yet. They appear after members upload photos to the team and give their consent for face grouping.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {folders.map(folder => (
                    <div key={folder.id} className="fc-card p-4">
                      <div className="flex items-center gap-3">
                        <Covers folder={folder} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate">{folder.display_name}</p>
                          <p className="text-xs text-ink-mute">{folder.member_count} photo{folder.member_count === 1 ? '' : 's'} · {folder.photos_in_organization} here · {folder.owner.username}</p>
                          {folder.matching_confidence !== null && <p className="text-[10px] text-ink-faint">Match confidence {Math.round(folder.matching_confidence)}%</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        }}
      </ModeratorGate>

      {merging && (
        <ConfirmDialog title="Merge these folders" confirmLabel="Merge" busyLabel="Merging…" busy={busy} error={formError} onCancel={() => setMerging(null)} onConfirm={merge}>
          <p>“{merging.source.display_name}” is merged into “{merging.target.display_name}”, and the first folder stops existing. The photos move; nothing is deleted.</p>
          <label htmlFor="merge-reason" className="block text-xs font-semibold text-ink pt-1">Reason (optional)</label>
          <input id="merge-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} className="fc-input" />
        </ConfirmDialog>
      )}
    </div>
  )
}
