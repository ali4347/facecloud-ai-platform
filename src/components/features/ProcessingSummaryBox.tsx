import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ProcessingSummary } from '../../lib/api/enhancements'
import { engineName, stageName } from '../../lib/stageNames'
import styles from './ProcessingSummaryBox.module.css'

/**
 * Which engine did what, and whether an AI model or a plain filter did it (`processing_summary` from the result). Shown on the upload result and on the
 * photo's own page. Renders nothing for a result that has none (a backend that predates it, or a failed job).
 */
export function ProcessingSummaryBox({ summary }: { summary: ProcessingSummary | null | undefined }) {
  if (!summary) return null
  const { ai_applied: ai, classical_fallback: fallback, stages } = summary
  return (
    <section className={styles.summary} aria-label="Processing summary">
      <h4 className={styles.summaryTitle}>Processing summary</h4>
      <div className={styles.badges}>
        {ai && <span className={`${styles.badge} ${styles.good}`}><CheckCircle2 aria-hidden="true" /> AI enhancement applied</span>}
        {fallback && <span className={`${styles.badge} ${styles.warn}`}><AlertTriangle aria-hidden="true" /> Classical fallback used</span>}
        {!ai && !fallback && <span className={`${styles.badge} ${styles.neutral}`}>{stages.length > 0 ? 'Standard filters only' : 'Original kept'}</span>}
      </div>
      {fallback && <p className={styles.note}>For at least one step the AI model was not available, or its result was not accepted, so a standard filter did that step instead.</p>}
      {stages.length === 0
        ? <p className={styles.note}>No step changed this photo.</p>
        : (
          <ol className={styles.stages}>
            {stages.map((stage, index) => (
              <li key={`${stage.stage}-${index}`} className={styles.stage}>
                <span className={styles.stageName}>{stageName(stage.stage)}</span>
                <span className={styles.stageEngine}>
                  {engineName(stage.engine)}
                  {stage.fallback && <> · stood in for {stage.replaced?.length ? stage.replaced.map(engineName).join(', ') : 'an unavailable model'}</>}
                </span>
                <span className={`${styles.kind} ${stage.kind === 'ai' ? styles.kindAi : ''}`}>{stage.kind === 'ai' ? 'AI' : stage.kind === 'classical' ? 'Classical' : 'Unknown'}</span>
                {stage.fallback && <span className={`${styles.kind} ${styles.kindWarn}`}>Fallback</span>}
              </li>
            ))}
          </ol>
        )}
    </section>
  )
}
