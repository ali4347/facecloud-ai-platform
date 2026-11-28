import { MODERATOR_REASON_MAX, MODERATOR_REASON_MIN, normalizeReason } from '../../lib/moderatorReason'

const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'

/**
 * "Reason for Moderator Assignment": required whenever the Platform Administrator makes someone a moderator directly.
 * `error` is the problem to show under it (the form's own check, or the server's sentence about `reason`).
 */
export function ModeratorReasonField({ id, value, onChange, error }: { id: string; value: string; onChange: (next: string) => void; error?: string }) {
  const length = normalizeReason(value).length
  return (
    <div className="space-y-1.5 max-w-xl">
      <label htmlFor={id} className={labelClass}>Reason for Moderator Assignment <span className="text-[#F87171]">*</span></label>
      <textarea
        id={id}
        className="fc-input w-full resize-y"
        rows={2}
        value={value}
        maxLength={MODERATOR_REASON_MAX}
        onChange={e => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
        placeholder="For example: the owner asked us to set up their first moderator during onboarding."
        // Checked by the form itself (reasonProblem), so an empty or short reason gets the same clear sentence as the server's.
        aria-required="true"
      />
      <p id={`${id}-hint`} className="text-[10px] text-ink-faint">
        Recorded in the organization’s audit trail, which its owner can read. Normally the owner invites moderators; say why an administrator is doing it.
        At least {MODERATOR_REASON_MIN} characters ({length}/{MODERATOR_REASON_MAX}).
      </p>
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-[#F87171]">{error}</p>}
    </div>
  )
}
