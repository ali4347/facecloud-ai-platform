import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Download, Pencil, Check, X, CheckSquare, Square,
  Archive, Link2, Users, Eye, ImageOff, Loader2, CheckCircle
} from 'lucide-react'
import { mockGroups, mockImages } from '../../data/mock'
import { formatDate } from '../../lib/utils'

// ─── Helper: resolve the representative image ─────────────────────────────────
function getRepresentativeImage(groupId: string, representativeId?: string) {
  if (representativeId) {
    const found = mockImages.find(img => img.id === representativeId)
    if (found) return found
  }
  const sorted = mockImages
    .filter(img => img.personFolderId === groupId && img.qualityStatus === 'passed')
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  return sorted[0] ?? null
}

// ─── Simulate ZIP generation ──────────────────────────────────────────────────
function simulateZip(count: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 1400 + count * 120))
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>()

  // ── Data ──────────────────────────────────────────────────────────────────
  const group = mockGroups.find(g => g.id === id) ?? mockGroups[0]
  const images = mockImages.filter(img => img.personFolderId === group.id)
  const repImage = getRepresentativeImage(group.id, group.representative_image_id)

  // ── Inline edit state ─────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false)
  const [personName, setPersonName] = useState(group.label)
  const [nameBuffer, setNameBuffer] = useState(group.label)

  const startEdit = () => { setNameBuffer(personName); setEditingName(true) }
  const cancelEdit = () => setEditingName(false)
  const saveEdit = () => { if (nameBuffer.trim()) setPersonName(nameBuffer.trim()); setEditingName(false) }

  // ── Selection state ───────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = images.length > 0 && selected.size === images.length
  const someSelected = selected.size > 0

  const toggleOne = (imgId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(imgId) ? next.delete(imgId) : next.add(imgId)
      return next
    })
  }
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(images.map(i => i.id)))
  }
  const clearSelection = () => setSelected(new Set())

  // ── ZIP download state ────────────────────────────────────────────────────
  const [zipState, setZipState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [zipTarget, setZipTarget] = useState<'all' | 'selected' | null>(null)

  const triggerDownload = useCallback(async (scope: 'all' | 'selected') => {
    if (zipState === 'loading') return
    const count = scope === 'all' ? images.length : selected.size
    setZipState('loading')
    setZipTarget(scope)
    await simulateZip(count)
    setZipState('done')
    setTimeout(() => { setZipState('idle'); setZipTarget(null) }, 2500)
  }, [zipState, images.length, selected.size, personName])

  const downloadLabel = (scope: 'all' | 'selected') => {
    if (zipState === 'loading' && zipTarget === scope) return 'Preparing ZIP…'
    if (zipState === 'done' && zipTarget === scope) return 'Ready! Downloading…'
    return scope === 'all' ? `Download All (${images.length})` : `Download Selected (${selected.size})`
  }

  // ── Secure link copy ──────────────────────────────────────────────────────
  const [linkCopied, setLinkCopied] = useState(false)
  const copyLink = () => {
    navigator.clipboard.writeText(`https://facecloud.ai/download/group-sec-${group.id}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="space-y-6">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/groups"
            className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Inline-editable person name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-soft-blue flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-accent" />
            </div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameBuffer}
                  onChange={e => setNameBuffer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                  className="bg-surface-mute border border-accent/40 rounded-lg px-3 py-1.5 text-lg font-bold text-ink focus:outline-none focus:border-accent w-52"
                />
                <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30/30 text-emerald-400 hover:bg-emerald-500/20"><Check className="w-4 h-4" /></button>
                <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-surface-mute border border-line text-ink-mute hover:text-ink"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">{personName}</h1>
                <button onClick={startEdit} className="p-1.5 rounded-lg hover:bg-surface-mute border border-transparent hover:border-line text-ink-mute hover:text-ink transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Download All + Secure Link buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => triggerDownload('all')}
            disabled={zipState === 'loading'}
            className="fc-btn-primary text-sm py-2 px-4 flex items-center gap-2 disabled:opacity-60"
          >
            {zipState === 'loading' && zipTarget === 'all' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : zipState === 'done' && zipTarget === 'all' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloadLabel('all')}
          </button>
          <button
            onClick={copyLink}
            className={`fc-btn-secondary text-sm py-2 px-4 flex items-center gap-2 transition-all ${linkCopied ? 'text-emerald-400 border-emerald-500/30/40' : ''}`}
          >
            {linkCopied ? <CheckCircle className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {linkCopied ? 'Copied!' : 'Secure Link'}
          </button>
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Images', value: images.length },
          { label: 'Avg. Confidence', value: `${group.matchingConfidence}%` },
          { label: 'Created', value: new Date(group.createdDate).toLocaleDateString() },
          { label: 'Last Updated', value: formatDate(group.lastUpdated) }
        ].map(stat => (
          <div key={stat.label} className="fc-card p-4">
            <p className="text-xs text-ink-mute uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Image grid ─────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          <div className="fc-card p-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm text-ink-mute hover:text-ink transition-colors"
                >
                  {allSelected
                    ? <CheckSquare className="w-4 h-4 text-accent" />
                    : <Square className="w-4 h-4" />}
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
                {someSelected && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
                    {selected.size} selected
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-mute">{images.length} image{images.length !== 1 ? 's' : ''} in this group</p>
            </div>

            {/* Grid */}
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <ImageOff className="w-10 h-10 text-ink-mute/40" />
                <p className="text-sm font-semibold text-ink-mute">No images in this group yet</p>
                <p className="text-xs text-ink-mute/60">Images will appear here once they are grouped into this identity folder.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map(img => {
                  const isSelected = selected.has(img.id)
                  return (
                    <div
                      key={img.id}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-150 cursor-pointer group ${
                        isSelected
                          ? 'border-accent shadow-[0_0_0_1px_rgba(249,115,22,0.3)]'
                          : 'border-line hover:border-line'
                      }`}
                      onClick={() => toggleOne(img.id)}
                    >
                      {/* Thumbnail */}
                      <div
                        className="aspect-[4/3] flex items-center justify-center relative"
                        style={{ background: `linear-gradient(135deg, ${img.thumbnail} 0%, ${img.thumbnail}88 100%)` }}
                      >
                        <svg width="40" height="52" viewBox="0 0 56 72" fill="none" className="opacity-50">
                          <ellipse cx="28" cy="28" rx="20" ry="24" fill="rgb(var(--a-ink-faint))" stroke="rgb(var(--a-ink-mute))" strokeWidth="1.5" />
                          <circle cx="21" cy="24" r="4" fill="rgb(var(--a-ink-mute))" />
                          <circle cx="35" cy="24" r="4" fill="rgb(var(--a-ink-mute))" />
                          <path d="M18 36 Q28 42 38 36" stroke="rgb(var(--a-ink-mute))" strokeWidth="2" fill="none" strokeLinecap="round" />
                          <path d="M8 72 C8 56 48 56 48 72" fill="rgb(var(--a-line))" />
                        </svg>
                        {/* Dim overlay + checkbox on hover / selected */}
                        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-150 ${isSelected || false ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                        {/* Checkbox */}
                        <div className={`absolute top-2 left-2 transition-all duration-150 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}>
                          {isSelected
                            ? <CheckSquare className="w-5 h-5 text-accent drop-shadow" />
                            : <Square className="w-5 h-5 text-ink drop-shadow" />
                          }
                        </div>
                        {/* Quality badge */}
                        <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          img.qualityStatus === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/30 text-red-300'
                        }`}>
                          {img.qualityStatus}
                        </span>
                        {/* View button */}
                        <Link
                          to={`/dashboard/images/${img.id}`}
                          onClick={e => e.stopPropagation()}
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Caption */}
                      <div className="p-3 bg-surface-mute">
                        <p className="text-xs font-semibold text-ink truncate">{img.filename}</p>
                        <p className="text-[10px] text-ink-mute mt-0.5">{img.size} · {img.dimensions}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Stats & Actions ───────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Group details card */}
          <div className="fc-card p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Cluster Details</p>

            {/* Representative image preview */}
            {repImage && (
              <div
                className="h-28 rounded-xl overflow-hidden flex items-center justify-center relative"
                style={{ background: `linear-gradient(135deg, ${repImage.thumbnail} 0%, ${repImage.thumbnail}88 100%)` }}
              >
                <svg width="44" height="56" viewBox="0 0 56 72" fill="none" className="opacity-50">
                  <ellipse cx="28" cy="28" rx="20" ry="24" fill="rgb(var(--a-ink-faint))" stroke="rgb(var(--a-ink-mute))" strokeWidth="1.5" />
                  <circle cx="21" cy="24" r="4" fill="rgb(var(--a-ink-mute))" />
                  <circle cx="35" cy="24" r="4" fill="rgb(var(--a-ink-mute))" />
                  <path d="M18 36 Q28 42 38 36" stroke="rgb(var(--a-ink-mute))" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M8 72 C8 56 48 56 48 72" fill="rgb(var(--a-line))" />
                </svg>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/40 text-[9px] text-white font-mono">
                  Representative
                </span>
              </div>
            )}

            <div className="space-y-2.5 text-xs text-ink-mute">
              {[
                { k: 'Folder ID', v: group.id },
                { k: 'Avg. Confidence', v: `${group.matchingConfidence}%`, accent: 'text-emerald-400' },
                { k: 'Created', v: new Date(group.createdDate).toLocaleDateString() },
                { k: 'Images linked', v: `${images.length} files` },
              ].map(row => (
                <div key={row.k} className="flex items-center justify-between">
                  <span>{row.k}</span>
                  <span className={`font-bold text-ink ${row.accent ?? ''}`}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions card */}
          <div className="fc-card p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Actions</p>
            <button
              onClick={() => triggerDownload('all')}
              disabled={zipState === 'loading'}
              className="fc-btn-primary w-full justify-center text-xs py-2.5 flex items-center gap-2 disabled:opacity-60"
            >
              {zipState === 'loading' && zipTarget === 'all' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              {downloadLabel('all')}
            </button>
            <button
              onClick={copyLink}
              className="fc-btn-secondary w-full justify-center text-xs py-2.5 flex items-center gap-2"
            >
              {linkCopied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
              {linkCopied ? 'Copied!' : 'Copy Secure Link'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating selection action bar ──────────────────────────────────── */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${someSelected ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#0D1B3E]/95 border border-accent/30 shadow-2xl backdrop-blur-xl">
          <span className="text-sm font-semibold text-ink">
            {selected.size} image{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="w-px h-5 bg-surface-mute" />
          <button
            onClick={() => triggerDownload('selected')}
            disabled={zipState === 'loading'}
            className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-soft transition-colors disabled:opacity-60"
          >
            {zipState === 'loading' && zipTarget === 'selected' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : zipState === 'done' && zipTarget === 'selected' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloadLabel('selected')}
          </button>
          <button
            onClick={clearSelection}
            className="flex items-center gap-1 text-sm text-ink-mute hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
