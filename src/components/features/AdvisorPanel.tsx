import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Loader2, ShieldCheck } from 'lucide-react'
import { ChartCard } from '../ui/ChartCard'
import { ApiError } from '../../lib/api/client'
import { useApiResource } from '../../lib/useApiResource'
import {
  applyRecommendation, askAdvisor, getAdvisorConfiguration, getRecommendation, isRecommendationDone, setAdvisorConsent,
  type AdvisorConfiguration, type AdvisorIntent, type AdvisorRecommendation,
} from '../../lib/api/tools'

const INTENTS: { value: AdvisorIntent; label: string }[] = [
  { value: 'auto', label: 'Whatever suits the photo' }, { value: 'preserve', label: 'Keep it natural' }, { value: 'brighten', label: 'Brighten it' },
]

/**
 * The optional AI advisor: it looks at ONE small preview of the enhanced photo and suggests slider settings. It is off unless the server owner
 * switched it on, so nothing is drawn when it is unavailable. Sending a preview to an outside service needs its own consent, shown with what is
 * sent. A suggestion is advice: applying it makes an ordinary edit of the photo and the original is never overwritten.
 */
export function AdvisorPanel({ resultId, imageId }: { resultId: number; imageId: number }) {
  const config = useApiResource(signal => getAdvisorConfiguration(signal), () => null as unknown as AdvisorConfiguration, [])
  const [intent, setIntent] = useState<AdvisorIntent>('auto')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needsConsent, setNeedsConsent] = useState(false)
  const [suggestion, setSuggestion] = useState<AdvisorRecommendation | null>(null)
  const [applied, setApplied] = useState(false)
  const data = config.data

  if (config.loading || config.error || !data?.available) return null
  const consented = Boolean(data.consent?.granted) && (!data.consent?.policy_version || data.consent.policy_version === data.policy_version)

  const ask = async () => {
    setBusy(true); setError(''); setSuggestion(null); setApplied(false)
    try {
      let current = await askAdvisor(resultId, intent)
      for (let i = 0; i < 45 && !isRecommendationDone(current); i += 1) { await new Promise(resolve => setTimeout(resolve, 2000)); current = await getRecommendation(current.id) }
      setSuggestion(current)
      if (current.status === 'failed') setError(current.failure_reason || 'The advisor did not answer.')
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) setNeedsConsent(true)
      else setError(caught instanceof Error ? caught.message : 'The advisor did not answer.')
    } finally { setBusy(false) }
  }
  const allow = async () => {
    setBusy(true); setError('')
    try { await setAdvisorConsent(true, data.policy_version); setNeedsConsent(false); config.reload() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save your choice.') } finally { setBusy(false) }
  }
  const apply = async () => {
    if (!suggestion) return
    setBusy(true); setError('')
    try { await applyRecommendation(suggestion.id); setApplied(true) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not apply the suggestion.') } finally { setBusy(false) }
  }

  return (
    <ChartCard title="AI advisor" subtitle="Optional: suggests slider settings for this photo">
      <div className="space-y-4 text-xs text-ink-mute">
        {(!consented || needsConsent) ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-ink font-semibold"><ShieldCheck className="w-4 h-4 text-accent" />Your permission first</p>
            <p>{data.disclosure.what_is_sent}</p>
            <p>{data.disclosure.retention}</p>
            <p className="text-ink-faint">{data.disclosure.separate_from}</p>
            <button type="button" onClick={() => void allow()} disabled={busy} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}I agree: allow the advisor</button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-[11px] font-semibold text-ink">What do you want
                <select value={intent} onChange={event => setIntent(event.target.value as AdvisorIntent)} className="fc-input mt-1.5">{INTENTS.filter(option => data.intents.includes(option.value)).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              </label>
              <button type="button" onClick={() => void ask()} disabled={busy} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}{busy ? 'Asking…' : 'Ask the advisor'}</button>
            </div>
            {data.cost_note && <p className="text-[11px] text-ink-faint">{data.cost_note}</p>}
          </>
        )}
        {suggestion && suggestion.status === 'completed' && (
          <div className="p-4 rounded-2xl bg-surface-mute border border-line space-y-2">
            <p className="text-sm font-semibold text-ink">{suggestion.action === 'apply' ? 'A suggestion' : suggestion.action === 'no_change' ? 'The advisor would change nothing' : 'The advisor wants a person to look'}</p>
            {suggestion.rationale && <p>{suggestion.rationale}</p>}
            {suggestion.origin === 'local_fallback' && <p className="text-ink-faint">The outside advisor could not be used, so this is the server's own cautious suggestion{suggestion.fallback_reason ? ` (${suggestion.fallback_reason.replace(/_/g, ' ')})` : ''}.</p>}
            {suggestion.adjustments && suggestion.action === 'apply' && (
              <ul className="flex flex-wrap gap-2">{Object.entries(suggestion.adjustments).map(([name, value]) => <li key={name} className="px-2.5 py-1 rounded-full border border-line text-[11px] text-ink">{name.replace(/_/g, ' ')}: {typeof value === 'number' ? value.toFixed(2).replace(/\.?0+$/, '') : String(value)}</li>)}</ul>
            )}
            {(suggestion.caution_flags ?? []).length > 0 && <p className="text-[#F59E0B]">Careful: {(suggestion.caution_flags ?? []).map(flag => flag.replace(/_/g, ' ')).join(', ')}.</p>}
            {suggestion.action === 'apply' && suggestion.usable && !applied && <button type="button" onClick={() => void apply()} disabled={busy} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Apply this suggestion</button>}
            {applied && <p className="text-emerald-400">Applied as a new version of the photo. <Link to={`/dashboard/images/${imageId}/edit`} className="underline font-semibold">Open it in the editor</Link>.</p>}
            {suggestion.action === 'apply' && !suggestion.usable && <p className="text-ink-faint">This suggestion can no longer be applied{suggestion.unusable_reason ? ` (${suggestion.unusable_reason.replace(/_/g, ' ')})` : ''}. Ask again.</p>}
          </div>
        )}
        {error && <p role="alert" className="text-red-500">{error}</p>}
      </div>
    </ChartCard>
  )
}
