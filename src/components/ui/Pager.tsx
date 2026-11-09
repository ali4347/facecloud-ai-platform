/** Previous / Next for a paged list. Renders nothing when there is only one page. */
export function Pager({ page, hasNext, hasPrevious, onPage }: { page: number; hasNext: boolean; hasPrevious: boolean; onPage: (next: number) => void }) {
  if (!hasNext && !hasPrevious) return null
  const button = 'px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default'
  return (
    <div className="flex items-center justify-center gap-3 mt-8 text-xs">
      <button type="button" disabled={!hasPrevious} onClick={() => onPage(Math.max(1, page - 1))} className={button}>Previous</button>
      <span className="text-ink-mute">Page {page}</span>
      <button type="button" disabled={!hasNext} onClick={() => onPage(page + 1)} className={button}>Next</button>
    </div>
  )
}
