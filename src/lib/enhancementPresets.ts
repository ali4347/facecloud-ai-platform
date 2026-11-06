import type { EnhancementLevel, EnhancementLighting, EnhancementResult, EnhancementStyle } from './api/enhancements'

export type PresetKey = 'auto' | 'standard' | 'pro'

export interface Preset { key: PresetKey; label: string; hint: string; level: EnhancementLevel; style: EnhancementStyle }

/**
 * The three presets. The backend resolves a preset to a level + style pair (`enhancement/serializers.py` PRESETS); the pair is sent instead of the
 * name so this works on a backend that predates presets too, and the result reports the pair that was used either way.
 */
export const PRESETS: readonly Preset[] = [
  { key: 'auto', label: 'Auto', hint: 'Fast', level: 'auto', style: 'natural' },
  { key: 'standard', label: 'Standard', hint: 'Balanced', level: 'high', style: 'natural' },
  { key: 'pro', label: 'Pro', hint: 'AI Max', level: 'high', style: 'ai_max' },
]

/** The (level, style) pair of a preset, the form the server is asked in. */
export function presetPair(key: PresetKey): { level: EnhancementLevel; style: EnhancementStyle } {
  const preset = PRESETS.find(item => item.key === key) ?? PRESETS[0]
  return { level: preset.level, style: preset.style }
}

/** Which preset a (level, style) pair is, by name, or null when it is none of the three (a pair set some other way, or one the server did not report). */
export function presetOf(level: EnhancementLevel | undefined | null, style: EnhancementStyle | undefined | null): 'Auto' | 'Standard' | 'Pro' | null {
  const found = PRESETS.find(item => item.level === level && item.style === style)
  return found ? (found.label as 'Auto' | 'Standard' | 'Pro') : null
}

const LIGHTING_WORDS: Record<EnhancementLighting, string> = { auto: 'Auto', dark: 'Dark photo', light: 'Light photo' }
export const lightingWords = (lighting: EnhancementLighting): string => LIGHTING_WORDS[lighting]

/**
 * One sentence when the server did not do what the person asked, or null. The result says what was requested (`requested_level`,
 * `requested_style`, `requested_lighting`); a difference from the choice made on the screen means the server did not use it. An older
 * backend sends no `requested_lighting`, so a lighting choice cannot be confirmed there and the sentence says that, not that it was ignored.
 */
export function ignoredChoice(picked: { preset: PresetKey; lighting: EnhancementLighting }, result: EnhancementResult): string | null {
  const parts: string[] = []
  const wanted = presetPair(picked.preset)
  if (result.requested_level !== wanted.level || result.requested_style !== wanted.style) {
    const used = presetOf(result.requested_level, result.requested_style)
    parts.push(`You chose ${PRESETS.find(item => item.key === picked.preset)?.label ?? 'a preset'}, but the server used ${used ?? `level ${result.requested_level}, style ${result.requested_style}`}.`)
  }
  if (picked.lighting !== 'auto' && result.requested_lighting !== picked.lighting) {
    parts.push(result.requested_lighting === undefined
      ? `You chose "${lightingWords(picked.lighting)}", but this server did not report using it, so the result may follow its own choice.`
      : `You chose "${lightingWords(picked.lighting)}", but the server used "${lightingWords(result.requested_lighting)}".`)
  }
  return parts.length ? parts.join(' ') : null
}

/**
 * The same check for a whole upload, from what the server says it took (`auto_enhance_options` in the upload's answer: `{}` when nothing was sent).
 * A backend that predates the fields sends no such key at all, so a choice cannot be confirmed there.
 */
export function ignoredBatchChoice(
  picked: { preset: PresetKey; lighting: EnhancementLighting },
  echoed: { level?: EnhancementLevel; style?: EnhancementStyle; lighting?: EnhancementLighting } | undefined,
): string | null {
  const wanted = presetPair(picked.preset)
  const chose = picked.preset !== 'auto' || picked.lighting !== 'auto'
  if (!chose) return null
  if (echoed === undefined) return 'This server did not report which enhancement it used for this upload, so it may have followed its own choice.'
  const got = { level: echoed.level ?? 'auto', style: echoed.style ?? 'natural', lighting: echoed.lighting ?? 'auto' }
  if (got.level === wanted.level && got.style === wanted.style && got.lighting === picked.lighting) return null
  const preset = presetOf(got.level, got.style)
  return `You chose ${PRESETS.find(item => item.key === picked.preset)?.label}${picked.lighting !== 'auto' ? ` and "${lightingWords(picked.lighting)}"` : ''}, but the server used ${preset ?? `level ${got.level}, style ${got.style}`}${got.lighting !== 'auto' ? ` and "${lightingWords(got.lighting)}"` : ''}.`
}
