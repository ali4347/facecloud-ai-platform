import type { ReactNode } from 'react'
import { FaceCloudLogo } from '../branding/FaceCloudLogo'

/** The centred card-on-gradient layout shared by the password recovery screens. */
export function AuthShell({ roleLabel, children }: { roleLabel: string; children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative p-6 overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 20% 15%, rgba(249, 115, 22,0.18), transparent 38%),' +
          'radial-gradient(circle at 80% 85%, rgba(234, 88, 12,0.14), transparent 38%),' +
          'rgb(var(--a-surface-soft))',
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[8%] left-[5%] w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'rgba(249, 115, 22,0.08)' }} />
        <div className="absolute bottom-[8%] right-[5%] w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(234, 88, 12,0.08)' }} />
      </div>
      <div className="w-full max-w-md relative z-10 space-y-5">
        <div className="text-center">
          <FaceCloudLogo variant="full" size="lg" roleLabel={roleLabel} href="/" priority={true} className="mx-auto" tone="app" />
        </div>
        <div className="fc-panel-strong p-8">{children}</div>
      </div>
    </div>
  )
}
