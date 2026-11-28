import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { GradientButton } from '../ui/GradientButton'
import { RequestDownloadDialog, type RequestCandidate } from './RequestDownloadDialog'
import { DOWNLOAD_APPROVAL_REFUSED, type ApprovalRefusalDetail } from '../../lib/api/client'
import { getImage } from '../../lib/api/images'
import { resolveRefusedFile } from '../../lib/refusedFile'
import { listOrganizations } from '../../lib/api/organizations'
import type { ArtifactType } from '../../lib/api/downloads'
import { refusalCanBeRequested, refusalSentence } from '../../lib/downloadApproval'

interface Pending {
  refusal: ApprovalRefusalDetail
  candidate: RequestCandidate | null
  artifact: ArtifactType
  artifactId?: number
  organizationName?: string
}

/**
 * Mounted once in the user portal. Any download a member tries (a photo card, the editor, the comparison viewer, a batch
 * ZIP, a person-folder ZIP, a share link, the download history) that an approval-required organization refuses arrives
 * here, and the member gets the reason and, where asking can help, "Request download access" for that photo.
 * The screen that started the download still shows its own error line; this adds the way forward.
 */
export function DownloadAccessHost() {
  const [pending, setPending] = useState<Pending | null>(null)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    const onRefused = (event: Event) => {
      const refusal = (event as CustomEvent<ApprovalRefusalDetail>).detail
      if (!refusal) return
      setRequesting(false)
      setPending({ refusal, candidate: null, artifact: 'enhanced' })
      void (async () => {
        try {
          const file = await resolveRefusedFile(refusal.path)
          if (!file) return
          const [image, organizations] = await Promise.all([getImage(file.imageId), listOrganizations().catch(() => [])])
          if (!image.organization_id) return
          const organization = organizations.find(o => o.id === image.organization_id)
          setPending(current => current && current.refusal === refusal ? {
            ...current,
            candidate: { id: image.id, name: image.original_name, organizationId: image.organization_id as number },
            artifact: file.artifact, artifactId: file.artifactId,
            organizationName: organization ? organization.brand_name?.trim() || organization.name : undefined,
          } : current)
        } catch { /* without the photo's details the dialog still explains the refusal */ }
      })()
    }
    window.addEventListener(DOWNLOAD_APPROVAL_REFUSED, onRefused)
    return () => window.removeEventListener(DOWNLOAD_APPROVAL_REFUSED, onRefused)
  }, [])

  if (!pending) return null
  const close = () => { setPending(null); setRequesting(false) }
  const { refusal, candidate } = pending

  if (requesting && candidate) {
    return (
      <RequestDownloadDialog
        candidates={[candidate]}
        organizationNames={pending.organizationName ? { [candidate.organizationId]: pending.organizationName } : {}}
        initialArtifact={pending.artifact}
        artifactId={pending.artifactId}
        onClose={close}
      />
    )
  }

  const askable = refusalCanBeRequested(refusal.reason)
  return (
    <Modal
      title="Download needs approval"
      onClose={close}
      footer={(
        <>
          <Link to="/dashboard/download-requests" onClick={close} className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium border border-line text-ink-soft hover:bg-surface-mute">
            My download requests
          </Link>
          {askable && candidate && refusal.reason !== 'bulk_not_allowed' && (
            <GradientButton size="sm" onClick={() => setRequesting(true)}>Request download access</GradientButton>
          )}
          {askable && (!candidate || refusal.reason === 'bulk_not_allowed') && (
            <Link to="/dashboard/images" onClick={close} className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-br from-accent to-accent-soft text-white">
              Choose photos to request
            </Link>
          )}
        </>
      )}
    >
      <p className="flex items-start gap-2 text-ink">
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" aria-hidden />
        <span>{refusalSentence(refusal.reason, refusal.message)}</span>
      </p>
      {candidate && <p className="text-xs">Photo: <span className="font-semibold text-ink">{candidate.name}</span>{pending.organizationName ? ` · ${pending.organizationName}` : ''}</p>}
      {askable && <p className="text-xs">Approved photos are downloaded from the request’s page, one by one or as a ZIP.</p>}
    </Modal>
  )
}
