import { Users } from 'lucide-react'
import type { Organization } from '../../lib/api/organizations'

interface SubmitToSelectProps {
  teams: Organization[]
  value: number | undefined
  onChange: (id: number | undefined) => void
}

/** "Submit to: My workspace / <team>", shown only to someone who belongs to a team. */
export function SubmitToSelect({ teams, value, onChange }: SubmitToSelectProps) {
  if (teams.length === 0) return null
  const team = teams.find(t => t.id === value)
  return (
    <div className="p-3 rounded-2xl bg-surface-mute border border-line text-xs space-y-2">
      <label htmlFor="submit-to" className="flex items-center gap-2 font-semibold text-ink"><Users className="w-3.5 h-3.5 text-accent" />Submit to</label>
      <select id="submit-to" value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="fc-input text-ink" style={{ background: 'rgb(var(--a-surface))', border: '1px solid rgb(var(--a-line))' }}>
        <option value="">My workspace (only I can see these photos)</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name} (team)</option>)}
      </select>
      {team && <p className="text-[10px] text-ink-mute leading-relaxed">The moderators of {team.name} will be able to see these photos and review them.</p>}
    </div>
  )
}
