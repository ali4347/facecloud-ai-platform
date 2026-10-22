import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, MinusCircle } from 'lucide-react'
import type { AppliedStage, EnhancementResult } from '../../lib/api/enhancements'

/** What each stage does, in plain words, as a past-tense phrase and a short name. */
const STAGES: Record<string, { name: string; done: (s: AppliedStage) => string }> = {
  low_light: { name: 'Low light', done: () => 'Lifted the light' },
  denoise: { name: 'Noise', done: () => 'Reduced the noise' },
  deblur: { name: 'Blur', done: () => 'Removed blur' },
  face_restore: { name: 'Face', done: () => 'Restored the face' },
  upscale: {
    name: 'HD',
    done: s => {
      const size = s.output_size ? ` to ${s.output_size[0]} × ${s.output_size[1]}` : ''
      return `Enlarged${s.scale ? ` ×${s.scale}` : ''}${size}`
    },
  },
}

const ENGINES: Record<string, string> = {
  nafnet_gopro: 'NAFNet', realesrgan: 'Real-ESRGAN', codeformer: 'CodeFormer', gfpgan: 'GFPGAN',
  codeformer_or_gfpgan: 'face restoration model', zero_dce: 'Zero-DCE', retinexformer: 'Retinexformer',
}

const stageName = (stage: string) => STAGES[stage]?.name ?? stage.replace(/_/g, ' ')

/** The first sentence of a long technical reason, so a file path does not fill the screen. */
const shortReason = (reason: string) => reason.split(/[;:(]/)[0].trim() || reason

/** Render an arbitrary value from the backend's diagnosis or plan as readable lines. */
function Detail({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) return <span className="text-ink-faint">none</span>
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-ink-faint">none</span>
    return <ul className="space-y-1">{value.map((item, i) => <li key={i}><Detail value={item} depth={depth + 1} /></li>)}</ul>
  }
  if (typeof value === 'object') {
    return (
      <dl className={`space-y-0.5 ${depth > 0 ? 'pl-3 border-l border-line' : ''}`}>
        {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
          <div key={key} className="flex gap-2 flex-wrap">
            <dt className="text-ink-faint">{key.replace(/_/g, ' ')}:</dt>
            <dd className="text-ink-mute"><Detail value={item} depth={depth + 1} /></dd>
          </div>
        ))}
      </dl>
    )
  }
  if (typeof value === 'number') return <span>{Number.isInteger(value) ? value : Math.round(value * 100) / 100}</span>
  return <span>{String(value)}</span>
}

/**
 * What the enhancement actually did to a photo: the stages that ran, the ones that were needed but could not run
 * and why, and (when the backend supplies them) what it measured and planned. It only reports what the backend says,
 * so a photo that no stage changed is never described as improved.
 */
export function EnhancementReport({ result }: { result: EnhancementResult }) {
  const [open, setOpen] = useState(false)
  const applied = result.applied_stages ?? []
  const skipped = result.skipped_stages ?? []
  const hasStageData = result.applied_stages !== undefined
  const hasDetails = skipped.length > 0 || result.diagnosis != null || result.plan != null || !!result.hd_unavailable_reason

  // The backend's own sentence wins; otherwise build one from the stages that ran.
  const sentence = result.enhancement_summary
    || (applied.length > 0 ? `${applied.map(s => STAGES[s.stage]?.done(s) ?? stageName(s.stage)).join(', ')}.` : '')

  if (!hasStageData && !sentence && !hasDetails) return null

  return (
    <div className="p-4 rounded-2xl bg-surface-mute border border-line space-y-3 text-xs">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">What was done</p>

      {sentence && <p className="text-ink">{sentence}</p>}

      {applied.length > 0 && (
        <ul className="space-y-1.5">
          {applied.map((stage, i) => (
            <li key={`${stage.stage}-${i}`} className="flex items-start gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-px" />
              <span className="text-ink-soft">
                <span className="font-semibold text-ink">{stageName(stage.stage)}</span>
                {' · '}{STAGES[stage.stage]?.done(stage) ?? 'Applied'}
                {stage.engine ? <span className="text-ink-faint"> · {ENGINES[stage.engine] ?? stage.engine}{stage.variant ? ` (${stage.variant})` : ''}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {hasStageData && applied.length === 0 && !result.hd_unavailable_reason && (
        <p className="flex items-start gap-2 text-ink-mute">
          <MinusCircle className="w-4 h-4 flex-shrink-0 mt-px" />
          <span>
            Nothing needed fixing, so this photo was left as it is. Enhancement changes dark, noisy or blurry photos the most.
          </span>
        </p>
      )}

      {result.hd_unavailable_reason && (
        <p role="status" className="flex items-start gap-2 p-3 rounded-xl text-[#FCD34D] bg-[#F59E0B]/10 border border-[#F59E0B]/25">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-px" />
          <span>
            <span className="font-semibold">HD restoration is not available on this server.</span>{' '}
            <span className="text-ink-mute">This photo needed restoration, so it was only lightly adjusted and is not presented as restored.</span>
          </span>
        </p>
      )}

      {hasDetails && (
        <div>
          <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
            className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline cursor-pointer">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {open ? 'Hide details' : 'Show details'}
          </button>
          {open && (
            <div className="mt-3 space-y-3 text-[11px]">
              {skipped.length > 0 && (
                <div>
                  <p className="font-semibold text-ink mb-1">Needed but not run</p>
                  <ul className="space-y-1">
                    {skipped.map(item => (
                      <li key={item.stage} className="text-ink-mute">
                        <span className="font-semibold text-ink-soft">{stageName(item.stage)}</span>: {shortReason(item.reason)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.hd_unavailable_reason && (
                <div>
                  <p className="font-semibold text-ink mb-1">Technical reason</p>
                  <p className="text-ink-faint break-words">{result.hd_unavailable_reason}</p>
                </div>
              )}
              {result.diagnosis != null && (
                <div><p className="font-semibold text-ink mb-1">What the photo needed</p><Detail value={result.diagnosis} /></div>
              )}
              {result.plan != null && (
                <div><p className="font-semibold text-ink mb-1">What was planned</p><Detail value={result.plan} /></div>
              )}
              {result.output_width && result.output_height && (
                <p className="text-ink-faint">Output size {result.output_width} × {result.output_height}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
