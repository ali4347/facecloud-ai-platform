import { PRESETS, type PresetKey } from '../../lib/enhancementPresets'

const HINTS: Record<PresetKey, string> = {
  auto: 'FaceCloud chooses how strongly to correct each photo.',
  standard: 'A strong correction that keeps the photo looking natural.',
  pro: 'Pro uses the strongest models, so one photo can take a minute or two. A restored face is kept only if it still matches the person in your photo, and any step that fails a safety check is skipped.',
}

/** "Enhancement: Auto · Standard · Pro": how strongly the upload's enhancement should work. Sent with the upload; the server does the work in its own pipeline. */
export function PresetPicker({ id, value, onChange, disabled = false }: { id: string; value: PresetKey; onChange: (next: PresetKey) => void; disabled?: boolean }) {
  return (
    <div>
      <span id={`${id}-label`} className="text-[11px] font-semibold text-ink block mb-1.5">Enhancement</span>
      <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`} className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface-mute border border-line">
        {PRESETS.map(preset => {
          const active = preset.key === value
          return (
            <button
              key={preset.key}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(preset.key)}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent flex flex-col items-center leading-tight ${
                active ? 'bg-accent/15 text-accent border border-accent/30' : 'text-ink-mute hover:text-ink border border-transparent'
              }`}
            >
              <span>{preset.label}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-accent/80' : 'text-ink-faint'}`}>{preset.hint}</span>
            </button>
          )
        })}
      </div>
      <p id={`${id}-hint`} className="text-[11px] text-ink-faint mt-1.5">{HINTS[value]}</p>
    </div>
  )
}
