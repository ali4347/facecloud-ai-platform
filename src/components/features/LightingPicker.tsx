import { Moon, Sun } from 'lucide-react'
import type { EnhancementLighting, LightingInfo } from '../../lib/api/enhancements'

const CHOICES: { value: EnhancementLighting; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'dark', label: 'Dark photo' },
  { value: 'light', label: 'Light photo' },
]

const HINTS: Record<EnhancementLighting, string> = {
  auto: 'FaceCloud checks whether the photo is dark or light and chooses the method.',
  dark: 'Brightens shadows first, then reduces noise.',
  light: 'Keeps brightness, sharpens and restores detail.',
}

/** "Lighting: Auto · Dark photo · Light photo": whether the enhancement should treat the photo as a dark one or a light one, or decide by itself. */
export function LightingPicker({ id, value, onChange, disabled = false }: { id: string; value: EnhancementLighting; onChange: (next: EnhancementLighting) => void; disabled?: boolean }) {
  return (
    <div>
      <span id={`${id}-label`} className="text-[11px] font-semibold text-ink block mb-1.5">Lighting</span>
      <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`} className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface-mute border border-line">
        {CHOICES.map(choice => {
          const active = choice.value === value
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(choice.value)}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? 'bg-accent/15 text-accent border border-accent/30' : 'text-ink-mute hover:text-ink border border-transparent'
              }`}
            >
              {choice.label}
            </button>
          )
        })}
      </div>
      <p id={`${id}-hint`} className="text-[11px] text-ink-faint mt-1.5">{HINTS[value]}</p>
    </div>
  )
}

/**
 * Which method the enhancement used, from the result: `used` when the backend says it (a method the person chose), otherwise what it `detected`.
 * Older results carry no `lighting`: nothing is shown for them. A photo seen as dark that was not brightened (it was not safe to apply) is never
 * described as brightened.
 */
export function LightingBadge({ lighting }: { lighting?: LightingInfo | null }) {
  const method = lighting?.used ?? lighting?.detected
  if (!lighting || (method !== 'dark' && method !== 'light')) return null
  const dark = method === 'dark'
  // A dark-photo method that did not brighten anything is not a success: it never wears the accent pill: a method the person forced gets a warning pill that says so, one the engine only noticed gets a plain one.
  const unchanged = dark && lighting.brightened === false
  const Icon = dark ? Moon : Sun
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${
        unchanged
          ? (lighting.forced ? 'border-[#F59E0B]/35 bg-[#F59E0B]/10 text-[#B45309] [html[data-theme=dark]_&]:text-[#FCD34D]' : 'border-line bg-surface text-ink-soft')
          : 'border-accent/30 bg-accent/10 text-accent'
      }`}>
        <Icon className="w-3 h-3" aria-hidden="true" />{unchanged ? (lighting.forced ? 'Dark-photo method changed nothing' : 'Seen as dark, not brightened') : dark ? 'Dark-photo method' : 'Light-photo method'}
      </span>
      {lighting.forced && <span className="text-[10px] text-ink-faint">chosen by you</span>}
      {unchanged && <span className="text-[10px] text-ink-faint">brightening was not safe to apply</span>}
    </span>
  )
}
