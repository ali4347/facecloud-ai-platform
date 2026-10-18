import { RANGES, type RangeDays } from '../../lib/adminAnalytics'

/** Pick how many days back the numbers cover. */
export function RangeChips({ value, onChange }: { value: RangeDays; onChange: (next: RangeDays) => void }) {
  return (
    <div className="flex items-center gap-2 mb-5" role="group" aria-label="Time range">
      <span className="text-xs text-ink-mute mr-1">Show the last</span>
      {RANGES.map(days => (
        <button key={days} type="button" onClick={() => onChange(days)} aria-pressed={value === days}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
            value === days ? 'bg-accent-tint text-accent-soft border-accent/30' : 'border-line text-ink-mute hover:text-ink'}`}>
          {days} days
        </button>
      ))}
    </div>
  )
}
