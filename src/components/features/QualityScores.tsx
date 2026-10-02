import { QUALITY_MEASURES, type QualityDecisionSummary } from '../../lib/api/images'

interface QualityScoresProps {
  quality: QualityDecisionSummary | null | undefined
  /** The acceptance threshold the backend uses, for the marker on each bar. */
  threshold?: number
  compact?: boolean
  /**
   * True when these numbers are demo values rather than measurements of the
   * photo on screen. It must be said: numbers that look measured but are not
   * are exactly what this component replaced.
   */
  sample?: boolean
}

function toneFor(score: number, threshold: number) {
  if (score >= threshold + 20) return { bar: '#10B981', text: 'text-[#10B981]' }
  if (score >= threshold) return { bar: '#F59E0B', text: 'text-[#F59E0B]' }
  return { bar: '#EF4444', text: 'text-[#F87171]' }
}

/**
 * What the quality checks actually measured.
 *
 * These are the real numbers the backend recorded, not a summary invented for
 * display: each one is a percentage against the same acceptance threshold, so
 * a low bar is the reason a photo was held or refused. Measures the pipeline
 * did not record are left out rather than shown as zero, which would read as
 * "this failed" when it means "this was not measured".
 */
export function QualityScores({ quality, threshold = 60, compact = false, sample = false }: QualityScoresProps) {
  if (!quality) return null

  const measures = QUALITY_MEASURES
    .map(measure => ({ ...measure, value: quality[measure.key] }))
    .filter((measure): measure is typeof measure & { value: number } =>
      typeof measure.value === 'number')

  if (measures.length === 0) return null

  const overall = quality.overall_score
  const overallTone = typeof overall === 'number' ? toneFor(overall, threshold) : null

  return (
    <div className="space-y-4">
      {typeof overall === 'number' && overallTone && (
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute">
            Overall quality{sample && ' (sample)'}
          </span>
          <span className={`text-lg font-bold ${overallTone.text}`}>{Math.round(overall)}%</span>
        </div>
      )}

      <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
        {measures.map(measure => {
          const tone = toneFor(measure.value, threshold)
          return (
            <div key={measure.key} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ink-mute">{measure.label}</span>
                <span className={`font-bold font-mono ${tone.text}`}>
                  {Math.round(measure.value)}%
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-surface-mute overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, measure.value))}%`, background: tone.bar }}
                />
                {/* Where "good enough" sits, so a bar reads without a legend. */}
                <div
                  className="absolute inset-y-0 w-px bg-ink/30"
                  style={{ left: `${threshold}%` }}
                  title={`Acceptance threshold: ${threshold}%`}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-ink-faint">
        {sample
          ? `Sample figures, not measured from this photo — connect the API for real ones. The line on each bar is the ${threshold}% mark a photo has to clear.`
          : `The line on each bar is the ${threshold}% mark a photo has to clear.`}
      </p>
    </div>
  )
}
