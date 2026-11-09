import { CheckCircle2, Loader2 } from 'lucide-react'
import { stageOrder, type BatchProgress } from '../../lib/api/images'

/** The steps a batch goes through, each tied to the backend stage it stands for. */
const STEPS: { label: string; stage: string }[] = [
  { label: 'Archive received', stage: 'uploaded' },
  { label: 'Preparing the photos', stage: 'preprocessing' },
  { label: 'Checking faces', stage: 'face_validation' },
  { label: 'Checking quality', stage: 'quality_analysis' },
  { label: 'Grouping by person', stage: 'identity_grouping' },
  { label: 'Enhancing', stage: 'enhancement' },
  { label: 'Finishing', stage: 'finalizing' },
]

const indexIn = (order: readonly string[], stage: string) => {
  // "queued" sits between received and preparing.
  const i = order.indexOf(stage)
  return i < 0 ? 0 : i
}

/**
 * Where a batch is right now, from the backend's own stage and each photo's stage. Nothing is timed or
 * simulated: a step is done when the batch has moved past it and current when the batch is on it.
 */
export function BatchStageList({ progress }: { progress: BatchProgress | null }) {
  const order = stageOrder(progress)
  const current = progress ? indexIn(order, progress.stage) : 0
  const steps = [...STEPS].sort((a, b) => indexIn(order, a.stage) - indexIn(order, b.stage))
  const perStage = (stage: string) => progress?.images.filter(row => row.stage === stage).length ?? 0

  return (
    <ol className="space-y-2">
      {steps.map(step => {
        const at = indexIn(order, step.stage)
        const done = at < current
        const active = at === current || (step.stage === 'preprocessing' && progress?.stage === 'queued')
        const here = perStage(step.stage) + (step.stage === 'preprocessing' ? perStage('queued') : 0)
        return (
          <li key={step.stage} className={`flex items-center gap-3 text-xs ${done ? 'text-emerald-400' : active ? 'text-accent font-semibold' : 'text-ink-faint'}`}>
            <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {done ? <CheckCircle2 className="w-4 h-4" /> : active ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />}
            </span>
            <span>{step.label}</span>
            {active && here > 0 && <span className="text-[10px] text-ink-mute font-normal">· {here} photo{here === 1 ? '' : 's'} here now</span>}
          </li>
        )
      })}
    </ol>
  )
}
