import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { FileImage, Files, FolderArchive, ArrowRight, CheckCircle } from 'lucide-react'

export default function UploadCenter() {
  const options = [
    {
      title: 'Single Image Upload',
      desc: 'Upload a single face portrait to restore lighting and validate compliance.',
      path: '/dashboard/upload/single',
      icon: FileImage,
      badge: 'Interactive Restores',
      color: 'border-accent/20 text-accent hover:border-accent'
    },
    {
      title: 'Multiple Batch Upload',
      desc: 'Upload up to 50 files. Estimates illumination levels and outputs status reports.',
      path: '/dashboard/upload/multiple',
      icon: Files,
      badge: 'Batch Queue',
      color: 'border-emerald-500/30/20 text-emerald-400 hover:border-emerald-500/30'
    },
    {
      title: 'ZIP Archive Upload',
      desc: 'Upload a ZIP folder of face portraits for fully automated cluster grouping.',
      path: '/dashboard/upload/zip',
      icon: FolderArchive,
      badge: 'Automated Folders',
      color: 'border-violet-500/30/20 text-violet-400 hover:border-violet-500/30'
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Center"
        subtitle="Select your preferred upload pipeline. FaceCloud automatically restores lighting and groups identities."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map(opt => (
          <div key={opt.title} className="fc-card p-6 flex flex-col justify-between aspect-square hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className={`p-3 rounded-2xl bg-surface-mute border border-line`}>
                  <opt.icon className="w-6 h-6 text-accent" />
                </div>
                <span className="text-[10px] font-bold text-ink-mute uppercase tracking-wider bg-surface-mute px-2 py-0.5 rounded-full border border-line">{opt.badge}</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-ink">{opt.title}</h3>
                <p className="text-xs text-ink-mute leading-relaxed">{opt.desc}</p>
              </div>
            </div>
            <Link to={opt.path} className="fc-btn-primary w-full text-xs font-bold py-3 mt-4">
              Access Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <ChartCard title="Upload Guidelines" subtitle="Biometric compliance rules">
          <div className="space-y-3">
            {[
              { text: 'File Formats: JPG, JPEG, PNG', ok: true },
              { text: 'ZIP files must contain only valid images (uncompressed folder hierarchies)', ok: true },
              { text: 'Single Image file size limit: 50MB; ZIP limit: 200MB', ok: true },
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
