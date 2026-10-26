import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Archive, Check, CheckCircle, CheckSquare, Copy, Download, Eye,
  GitMerge, ImageOff, Link2, Loader2, Pencil, Square, Trash2, Users, X,
} from 'lucide-react'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { MergeFolderPanel } from '../../components/features/MergeFolderPanel'
import { uploadStatusBadge } from '../../components/ui/StatusBadge'
import { deleteImage, getImageThumbnail } from '../../lib/api/images'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { deleteEmptyFolder } from '../../lib/api/identityReview'
import {
  createGroupExport, downloadIdentityExport, getIdentityExport, renameIdentityGroup, shareIdentityExport,
  type IdentityGroupExport,
} from '../../lib/api/identities'
import { formatBytes } from '../../lib/imageData'
import { useFolderImages, usePersonFolder } from '../../lib/personFolders'
import { formatDate } from '../../lib/utils'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Ask for the ZIP and wait for it: the server builds it in the background and says when it is ready. */
async function buildExport(groupId: number, imageIds?: number[]): Promise<IdentityGroupExport> {
  let current = await createGroupExport(groupId, imageIds)
  const deadline = Date.now() + 180_000
  while (current.status === 'queued' || current.status === 'generating') {
    if (Date.now() > deadline) throw new Error('The ZIP is taking longer than expected. Please try again in a minute.')
    await sleep(1500)
    current = await getIdentityExport(current.id)
  }
  if (current.status === 'failed') throw new Error(current.failure_reason || 'The ZIP could not be prepared.')
  if (current.status === 'expired') throw new Error('The ZIP expired before it could be used. Please try again.')
  return current
}

type Busy = null | 'all' | 'selected' | 'link'

export default function GroupDetailLive() {
  const { id } = useParams<{ id: string }>()
  const groupId = Number(id)

  const [page, setPage] = useState(1)
  const folder = usePersonFolder(groupId)
  const photos = useFolderImages(groupId, page)
  const images = photos.data?.results ?? []

  // ── Name ──────────────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false)
  const [nameBuffer, setNameBuffer] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const startEdit = () => { setNameBuffer(folder.data?.label ?? ''); setNameError(null); setEditingName(true) }
  const saveName = async () => {
    const next = nameBuffer.trim()
    if (!next) return
    if (next === folder.data?.label) { setEditingName(false); return }
    setSavingName(true)
    setNameError(null)
    try {
      await renameIdentityGroup(groupId, next)
      setEditingName(false)
      folder.reload()
    } catch (caught) {
      setNameError(caught instanceof Error ? caught.message : 'Could not rename this folder.')
    } finally {
      setSavingName(false)
    }
  }

  // ── Delete the selected photos ────────────────────────────────────────────
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')

  // ── Delete this folder when nothing is left in it ────────────────────────
  const navigate = useNavigate()
  const [deletingFolder, setDeletingFolder] = useState(false)
  const [folderBusy, setFolderBusy] = useState(false)
  const [folderError, setFolderError] = useState('')
  const removeFolder = async () => {
    setFolderBusy(true); setFolderError('')
    try {
      await deleteEmptyFolder(groupId)
      navigate('/dashboard/groups', { replace: true })
    } catch (caught) {
      setFolderError(caught instanceof Error ? caught.message : 'Could not delete this folder.')
      setFolderBusy(false)
    }
  }

  // ── Merge another folder into this one ────────────────────────────────────
  const [merging, setMerging] = useState(false)

  // (the delete action itself is defined after the selection below)

  // ── Selection (kept across pages; "select all" means this page) ───────────
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const pageIds = images.map(image => image.id)
  const allOnPage = pageIds.length > 0 && pageIds.every(imageId => selected.has(imageId))
  const toggleOne = (imageId: number) => setSelected(current => {
    const next = new Set(current)
    if (next.has(imageId)) next.delete(imageId)
    else next.add(imageId)
    return next
  })
  const toggleAll = () => setSelected(current => {
    const next = new Set(current)
    pageIds.forEach(imageId => (allOnPage ? next.delete(imageId) : next.add(imageId)))
    return next
  })

  const deleteSelectedPhotos = async () => {
    const ids = [...selected]
    setDeleting(true); setDeleteMessage('')
    let gone = 0
    let firstError = ''
    for (const photoId of ids) {
      try { await deleteImage(photoId); gone += 1 }
      catch (caught) { if (!firstError) firstError = caught instanceof Error ? caught.message : 'A photo could not be deleted.' }
    }
    setDeleting(false)
    setSelected(new Set())
    folder.reload(); photos.reload()
    if (gone < ids.length) { setDeleteMessage(`${gone} deleted, ${ids.length - gone} could not be deleted: ${firstError}`); return }
    setConfirmingDelete(false)
  }

  // ── ZIP and secure link ───────────────────────────────────────────────────
  const [busy, setBusy] = useState<Busy>(null)
  const [done, setDone] = useState<Busy>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const total = folder.data?.imageCount ?? 0
  // The folder's own figure when the backend gives it; otherwise the suggestions among the tiles on this page.
  const suggested = folder.data?.suggestedCount ?? images.filter(image => image.membership_state === 'needs_review').length

  const downloadZip = async (scope: 'all' | 'selected') => {
    if (busy) return
    setBusy(scope)
    setActionError(null)
    try {
      const made = await buildExport(groupId, scope === 'selected' ? [...selected] : undefined)
      const blob = await downloadIdentityExport(made.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = made.display_name || 'person-folder.zip'
      anchor.click()
      URL.revokeObjectURL(url)
      setDone(scope)
      setTimeout(() => setDone(null), 2500)
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Could not prepare the ZIP.')
    } finally {
      setBusy(null)
    }
  }

  /* The link points at the ZIP of the whole folder. Its token is shown here, once: the server keeps
     only a hash, so after leaving this page the link has to be made again. Copying is a convenience. */
  const makeLink = async () => {
    if (busy) return
    setBusy('link')
    setActionError(null)
    setCopied(false)
    try {
      const made = await buildExport(groupId)
      const shared = await shareIdentityExport(made.id)
      setLink({ url: shared.public_url, expiresAt: shared.expires_at })
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Could not make a secure link.')
    } finally {
      setBusy(null)
    }
  }

  const copyLink = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // The link is on screen and selectable; copying by hand still works.
    }
  }

  const zipLabel = (scope: 'all' | 'selected') =>
    busy === scope ? 'Preparing ZIP…'
    : done === scope ? 'Downloaded'
    : scope === 'all' ? `Download All (${total})` : `Download Selected (${selected.size})`

  // ── Loading and failure ───────────────────────────────────────────────────
  if (folder.loading) {
    return (
      <div className="text-center py-24 text-ink-faint">
        <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
        <p className="text-xs font-semibold">Loading this folder…</p>
      </div>
    )
  }
  if (folder.error || !folder.data) {
    return (
      <div className="text-center py-24">
        <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
        <p className="text-xs font-semibold text-ink">{folder.error ?? 'This folder could not be found.'}</p>
        <Link to="/dashboard/groups" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Person Folders
        </Link>
      </div>
    )
  }
  const group = folder.data

  return (
    <div className="space-y-6">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/groups" aria-label="Back to Person Folders"
            className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-soft-blue flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-accent" />
            </div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus value={nameBuffer} maxLength={120} aria-label="Folder name"
                  onChange={e => setNameBuffer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') void saveName(); if (e.key === 'Escape') setEditingName(false) }}
                  className="bg-surface-mute border border-accent/40 rounded-lg px-3 py-1.5 text-lg font-bold text-ink focus:outline-none focus:border-accent w-52"
                />
                <button onClick={() => void saveName()} disabled={savingName} aria-label="Save name"
                  className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-60">
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingName(false)} aria-label="Cancel rename"
                  className="p-1.5 rounded-lg bg-surface-mute border border-line text-ink-mute hover:text-ink">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">{group.label}</h1>
                <button onClick={startEdit} aria-label="Rename folder"
                  className="p-1.5 rounded-lg hover:bg-surface-mute border border-transparent hover:border-line text-ink-mute hover:text-ink transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => void downloadZip('all')} disabled={busy !== null || total === 0}
            className="fc-btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60"
          >
            {busy === 'all' ? <Loader2 className="w-4 h-4 animate-spin" />
              : done === 'all' ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {zipLabel('all')}
          </button>
          <button
            onClick={() => void makeLink()} disabled={busy !== null || total === 0}
            className="fc-btn-secondary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60"
          >
            {busy === 'link' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {busy === 'link' ? 'Making link…' : 'Secure Link'}
          </button>
          <button
            onClick={() => setMerging(open => !open)} aria-expanded={merging}
            className="fc-btn-secondary text-sm py-2 px-4 flex items-center gap-2"
          >
            <GitMerge className="w-4 h-4" /> Merge folder
          </button>
          {total === 0 && (
            <button onClick={() => { setFolderError(''); setDeletingFolder(true) }}
              className="fc-btn-secondary text-sm py-2 px-4 flex items-center gap-2 text-error">
              <Trash2 className="w-4 h-4" /> Delete empty folder
            </button>
          )}
        </div>
      </div>

      {merging && (
        <MergeFolderPanel
          targetId={groupId} targetLabel={group.label}
          onClose={() => setMerging(false)}
          onMerged={() => { setMerging(false); setSelected(new Set()); setPage(1); folder.reload(); photos.reload() }}
        />
      )}

      {nameError && <p role="alert" className="text-xs text-[#F87171]">{nameError}</p>}

      {actionError && (
        <div role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
          {actionError}
        </div>
      )}

      {link && (
        <div className="p-4 rounded-2xl border border-[#10B981]/25 bg-[#10B981]/10 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-[#10B981]">Secure link ready</p>
            <button onClick={() => setLink(null)} aria-label="Dismiss" className="text-ink-mute hover:text-ink cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <input readOnly value={link.url} aria-label="Secure link" onFocus={e => e.currentTarget.select()}
              className="fc-input flex-1 !py-2 text-xs font-mono" />
            <button onClick={() => void copyLink()} className="fc-btn-secondary text-xs px-3 flex items-center gap-1.5">
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-ink-mute">
            Anyone with this link can download a ZIP of this whole folder until {formatDate(link.expiresAt)}. It is shown only now:
            leave this page and you will need to make a new one.
          </p>
        </div>
      )}

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Images', value: String(group.imageCount) },
          { label: 'Avg. Confidence', value: group.confidence === null ? '—' : `${group.confidence}%` },
          { label: 'Created', value: formatDate(group.createdAt) },
          { label: 'Last Updated', value: formatDate(group.updatedAt) },
        ].map(stat => (
          <div key={stat.label} className="fc-card p-4">
            <p className="text-xs text-ink-mute uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="fc-card p-5">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <button onClick={toggleAll} disabled={pageIds.length === 0}
                  className="flex items-center gap-2 text-sm text-ink-mute hover:text-ink transition-colors disabled:opacity-50">
                  {allOnPage ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4" />}
                  {allOnPage ? 'Deselect this page' : 'Select this page'}
                </button>
                {selected.size > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
                    {selected.size} selected
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-mute">
                {total} image{total === 1 ? '' : 's'} in this folder
                {suggested > 0 && ` · ${suggested} more suggested, not confirmed yet`}
              </p>
            </div>

            {photos.loading && (
              <div className="text-center py-16 text-ink-faint">
                <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                <p className="text-xs font-semibold">Loading photos…</p>
              </div>
            )}
            {!photos.loading && photos.error && (
              <div className="text-center py-16">
                <p className="text-xs font-semibold text-ink mb-2">{photos.error}</p>
                <button onClick={photos.reload} className="text-xs font-bold text-[#FB923C] hover:underline cursor-pointer">Try again</button>
              </div>
            )}
            {!photos.loading && !photos.error && images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <ImageOff className="w-10 h-10 text-ink-mute/40" />
                <p className="text-sm font-semibold text-ink-mute">No photos in this folder yet</p>
                <p className="text-xs text-ink-mute/60">Photos appear here once they are filed into this person's folder.</p>
              </div>
            )}

            {!photos.loading && !photos.error && images.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map(image => {
                    const isSelected = selected.has(image.id)
                    return (
                      <div
                        key={image.id}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-150 cursor-pointer group ${
                          isSelected ? 'border-accent shadow-[0_0_0_1px_rgba(249,115,22,0.3)]' : 'border-line'
                        }`}
                        onClick={() => toggleOne(image.id)}
                      >
                        <div className="aspect-[4/3] relative bg-surface-mute">
                          <AuthedImage
                            load={image.thumbnail_url ? signal => getImageThumbnail(image.id, 256, signal) : null}
                            cacheKey={`folder-photo-${image.id}`}
                            alt={image.original_name}
                            className="w-full h-full !border-0"
                            rounded="rounded-none"
                          />
                          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                          <div className={`absolute top-2 left-2 transition-all duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {isSelected ? <CheckSquare className="w-5 h-5 text-accent drop-shadow" /> : <Square className="w-5 h-5 text-white drop-shadow" />}
                          </div>
                          <div className="absolute top-2 right-2">{uploadStatusBadge(image.display_status)}</div>
                          <Link
                            to={`/dashboard/images/${image.id}`} onClick={e => e.stopPropagation()}
                            aria-label={`Open ${image.original_name}`}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                        <div className="p-3 bg-surface-mute">
                          <p className="text-xs font-semibold text-ink truncate" title={image.original_name}>{image.original_name}</p>
                          <p className="text-[10px] text-ink-mute mt-0.5">
                            {formatBytes(image.file_size)}
                            {image.width && image.height ? ` · ${image.width}×${image.height}` : ''}
                            {image.matching_confidence !== null ? ` · ${Math.round(image.matching_confidence)}% match` : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {(photos.data?.next || photos.data?.previous) && (
                  <div className="flex items-center justify-center gap-3 mt-6 text-xs">
                    <button disabled={!photos.data?.previous} onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">
                      Previous
                    </button>
                    <span className="text-ink-mute">Page {page}</span>
                    <button disabled={!photos.data?.next} onClick={() => setPage(p => p + 1)}
                      className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right: details and actions ─────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="fc-card p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Folder Details</p>
            {group.coverImageIds[0] !== undefined && (
              <div className="h-28 rounded-xl overflow-hidden relative">
                <AuthedImage
                  load={signal => getImageThumbnail(group.coverImageIds[0], 256, signal)}
                  cacheKey={`folder-cover-${group.coverImageIds[0]}`}
                  alt={`A photo of ${group.label}`}
                  className="w-full h-full !border-0"
                  rounded="rounded-none"
                />
              </div>
            )}
            <div className="space-y-2.5 text-xs text-ink-mute">
              {[
                { k: 'Folder ID', v: group.id },
                { k: 'Avg. Confidence', v: group.confidence === null ? '—' : `${group.confidence}%` },
                { k: 'Created', v: formatDate(group.createdAt) },
                { k: 'Photos in folder', v: String(group.imageCount) },
              ].map(row => (
                <div key={row.k} className="flex items-center justify-between">
                  <span>{row.k}</span>
                  <span className="font-bold text-ink">{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fc-card p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Actions</p>
            <button
              onClick={() => void downloadZip('all')} disabled={busy !== null || total === 0}
              className="fc-btn-primary w-full justify-center text-xs py-2.5 flex items-center gap-2 disabled:opacity-60"
            >
              {busy === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              {zipLabel('all')}
            </button>
            <button
              onClick={() => void makeLink()} disabled={busy !== null || total === 0}
              className="fc-btn-secondary w-full justify-center text-xs py-2.5 flex items-center gap-2 disabled:opacity-60"
            >
              {busy === 'link' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {busy === 'link' ? 'Making link…' : 'Make Secure Link'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating selection bar ─────────────────────────────────────────── */}
      <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${selected.size > 0 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface border border-accent/30 shadow-2xl backdrop-blur-xl">
          <span className="text-sm font-semibold text-ink">{selected.size} image{selected.size === 1 ? '' : 's'} selected</span>
          <div className="w-px h-5 bg-line" />
          <button
            onClick={() => void downloadZip('selected')} disabled={busy !== null}
            className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-soft transition-colors disabled:opacity-60"
          >
            {busy === 'selected' ? <Loader2 className="w-4 h-4 animate-spin" />
              : done === 'selected' ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {zipLabel('selected')}
          </button>
          <button onClick={() => { setDeleteMessage(''); setConfirmingDelete(true) }} disabled={busy !== null}
            className="flex items-center gap-1.5 text-sm font-semibold text-error hover:underline disabled:opacity-60">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="flex items-center gap-1 text-sm text-ink-mute hover:text-ink transition-colors">
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
      {deletingFolder && (
        <ConfirmDialog title="Delete this empty folder?" confirmLabel="Delete folder" busyLabel="Deleting…" danger busy={folderBusy} error={folderError || null}
          onConfirm={() => void removeFolder()} onCancel={() => setDeletingFolder(false)}>
          <p>This folder has no photos left. Deleting it only removes the folder.</p>
        </ConfirmDialog>
      )}

      {confirmingDelete && (
        <ConfirmDialog title={`Delete ${selected.size} photo${selected.size === 1 ? '' : 's'}?`} confirmLabel="Delete" busyLabel="Deleting…" danger busy={deleting} error={deleteMessage || null}
          onConfirm={() => void deleteSelectedPhotos()} onCancel={() => setConfirmingDelete(false)}>
          <p>The selected photo{selected.size === 1 ? '' : 's'} will be permanently deleted from your account, not only from this folder, together with their enhanced versions.</p>
          <p>This cannot be undone.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
