import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ScanFace, ShieldCheck } from 'lucide-react'
import { GradientButton } from '../ui/GradientButton'
import { useFaceConsent } from '../../lib/consent'

/**
 * Asks whether FaceCloud may group the person's photos by face.
 *
 * It is a card, not a pop-up, and it is shown only where the question matters: on My Images
 * once someone has selected photos to group, and on Person Folders when it is empty because
 * of this. The caller decides when. "Not now" is a real
 * answer: photos are still enhanced and checked, only Person Folders stay off. If the
 * privacy policy changed after they agreed, the wording asks them to confirm again.
 */
export function ConsentCard({ selectedCount = 0, onAllowed, onNotNow }: {
  /** How many photos are selected, when the question comes from a selection; 0 otherwise. */
  selectedCount?: number
  /** Called after the yes has been saved. */
  onAllowed: () => void
  onNotNow: () => void
}) {
  const consent = useFaceConsent()

  return (
    <section
      aria-labelledby="consent-title"
      className="fc-panel-strong w-full max-w-xl p-5 space-y-4 shadow-soft-lg"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-accent-tint flex items-center justify-center flex-shrink-0">
          <ScanFace className="w-5 h-5 text-accent" />
        </div>
        <div className="space-y-1.5">
          <h2 id="consent-title" className="text-[15px] font-bold text-ink">
            {consent.needsReconfirm
              ? 'Please confirm face grouping again'
              : selectedCount > 0 ? 'Group these photos by person?' : 'Group your photos by person?'}
          </h2>
          <p className="text-[13px] text-ink-mute leading-relaxed">
            {consent.needsReconfirm
              ? 'Our privacy policy has changed since you agreed. To group photos by person we need you to confirm again.'
              : `${selectedCount > 0 ? `You selected ${selectedCount} photo${selectedCount === 1 ? '' : 's'}. ` : ''}To put photos of the same person into a Person Folder, FaceCloud needs your permission to analyse the faces in the photos you upload.`}
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 text-[13px] text-ink-soft">
        {[
          'Only photos you upload are analysed.',
          'You can turn this off at any time in Settings → Camera & Privacy, and ask for your face data to be deleted.',
          'If you say not now, your photos are still enhanced and checked. Only Person Folders stay off.',
        ].map(line => (
          <li key={line} className="flex gap-2.5">
            <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {consent.error && (
        <div role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
          {consent.error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <GradientButton variant="secondary" className="flex-1" onClick={onNotNow} disabled={consent.busy}>
          Not now
        </GradientButton>
        <GradientButton
          className="flex-1" disabled={consent.busy}
          onClick={async () => { if (await consent.allow()) onAllowed() }}
        >
          {consent.busy ? 'Saving…' : 'Allow face grouping'}
        </GradientButton>
      </div>

      {consent.policyVersion && (
        <p className="text-[10px] text-ink-faint">Privacy policy version {consent.policyVersion}</p>
      )}
    </section>
  )
}

/**
 * The line at the top of Person Folders that says why there may be none, and the way to fix it.
 *
 * Someone who opens this page is looking for their folders, so it is the natural place to explain
 * that face grouping is off. "Turn on face grouping" opens the full card rather than saving a yes
 * from one click: the person sees what they are agreeing to first. After a yes, a note says what
 * happens next, because photos uploaded earlier are not analysed on their own.
 */
export function ConsentBanner() {
  const consent = useFaceConsent()
  const [open, setOpen] = useState(false)
  const [justAllowed, setJustAllowed] = useState(false)

  if (justAllowed) {
    return (
      <div role="status" className="mb-5 p-4 rounded-2xl border border-[#10B981]/25 bg-[#10B981]/10 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-ink-soft">
          Face grouping is on. Photos you upload from now on are grouped by person. To group older photos, select them in{' '}
          <Link to="/dashboard/images" className="font-semibold text-[#FB923C] hover:underline">My Images</Link>{' '}
          and press <span className="font-semibold">Group by person</span>.
        </p>
      </div>
    )
  }

  if (!consent.needsConsent) return null

  return (
    <div className="mb-5 space-y-3">
      <div className="p-4 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 flex flex-wrap items-center gap-3">
        <ScanFace className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
        <p className="text-[13px] text-ink-soft flex-1 min-w-[16rem]">
          {consent.needsReconfirm
            ? 'Our privacy policy changed, so face grouping is paused until you confirm again.'
            : 'Face grouping is off, so no new Person Folders are being created.'}
        </p>
        {!open && (
          <GradientButton size="sm" onClick={() => setOpen(true)}>
            {consent.needsReconfirm ? 'Review and confirm' : 'Turn on face grouping'}
          </GradientButton>
        )}
      </div>

      {open && (
        <ConsentCard
          onNotNow={() => setOpen(false)}
          onAllowed={() => { setOpen(false); setJustAllowed(true) }}
        />
      )}
    </div>
  )
}
