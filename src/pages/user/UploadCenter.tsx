import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { UPLOAD_KINDS, UPLOAD_LIMITS, UploadArt } from '../../components/features/uploadKinds'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { USE_API } from '../../lib/api/config'

export default function UploadCenter() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Center"
        subtitle="Select your preferred upload pipeline. FaceCloud automatically restores lighting and groups identities."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {UPLOAD_KINDS.map(opt => (
          <article key={opt.kind} className="fc-card group p-4 flex flex-col gap-5">
            <UploadArt kind={opt.kind} className="h-40" />
            <div className="px-2 space-y-2">
              <h3 className="text-[17px] font-semibold text-ink tracking-tight leading-snug">{opt.title}</h3>
              <p className="text-[13px] text-ink-mute leading-relaxed">{opt.blurb}</p>
            </div>
            <ul className="px-2 flex flex-wrap gap-1.5" aria-label={`${opt.title}: what to expect`}>
              {opt.facts.map(fact => (
                <li key={fact} className="text-[11px] font-medium text-ink-soft px-2.5 py-1 rounded-full bg-surface-mute border border-line">{fact}</li>
              ))}
            </ul>
            <Link to={opt.path} className="fc-btn-primary w-full text-[13px] font-semibold py-3 mt-auto">
              {opt.cta} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <ChartCard title="Upload Guidelines" subtitle="Biometric compliance rules">
          <div className="space-y-3">
            {[
              { text: 'File Formats: JPG, JPEG, PNG', ok: true },
              { text: 'ZIP files must contain only valid images (uncompressed folder hierarchies)', ok: true },
              { text: `Single image file size limit: ${UPLOAD_LIMITS.image}; ZIP limit: ${UPLOAD_LIMITS.zip}${USE_API ? `, at most ${UPLOAD_LIMITS.zipPhotos} photos` : ''}`, ok: true },
              { text: 'Target face must be centered and face forward directly', ok: false },
              { text: 'Image resolution must not display excessive motion blur or noise indicators', ok: false }
            ].map((g, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${g.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'} mt-0.5 flex-shrink-0`}>
                  <CheckCircle className="w-3 h-3" />
                </div>
                <span className="text-xs text-ink">{g.text}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="What happens to your upload" subtitle="Each stage your photo goes through">
          <div className="grid grid-cols-2 gap-3 text-[11px] text-ink-mute">
            {[
              '1. Select upload type',
              '8. Accept or Reject',
              '2. Select files',
              '9. Face embedding extraction',
              '3. Store original image',
              '10. Person folder clustering',
              '4. Enhance image',
              '11. Secure downloads ready',
              '5. Save enhanced image',
              '12. In-app notification sent',
              '6. Validate face (1 face)',
              '13. Activity logged',
              '7. Quality verification checks'
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
