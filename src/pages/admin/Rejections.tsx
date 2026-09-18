import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { RejectionReasonChart } from '../../components/features/RejectionReasonChart'
import { rejectionReasonsData } from '../../data/mock'

export default function Rejections() {
  const total = rejectionReasonsData.reduce((a: number, d: any) => a + d.value, 0)

  return (
    <div>
      <PageHeader title="Rejection Summary" subtitle="Analysis of image rejections by reason." />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Rejection Reasons" subtitle="Distribution of all rejection types" delay={0.05}>
          <RejectionReasonChart />
        </ChartCard>

        <ChartCard title="Breakdown by Reason" subtitle="Detailed counts" delay={0.1}>
          <div className="space-y-3 mt-2">
            {rejectionReasonsData.map((item: any) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm text-ink">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-mute">{Math.round(total * item.value / 100)} images</span>
                    <span className="text-sm font-bold text-ink">{item.value}%</span>
                  </div>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 bg-background rounded-2xl">
            <p className="text-xs font-semibold text-ink mb-2">Top Rejection Actions</p>
            <ul className="space-y-1.5 text-xs text-ink-mute">
              <li>• Ensure images are well-lit before uploading</li>
              <li>• Upload one face per image only</li>
              <li>• Use min. 480×640px resolution images</li>
              <li>• Avoid motion blur and overexposure</li>
            </ul>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
