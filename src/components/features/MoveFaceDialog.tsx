import { useState } from 'react'
import { Check, Loader2, Users } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useApiResource } from '../../lib/useApiResource'
import { listIdentityGroups, moveMembership, type IdentityGroup } from '../../lib/api/identities'

/** Choose the folder a face belongs in instead. Moving a folder's last photo deletes that folder, and the dialog says so. */
export function MoveFaceDialog({ membershipId, fromGroupId, fromCount, onClose, onMoved }: { membershipId: number; fromGroupId: number; fromCount: number; onClose: () => void; onMoved: (target: IdentityGroup) => void }) {
  const folders = useApiResource(signal => listIdentityGroups(signal), () => [] as IdentityGroup[], [])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const others = (folders.data ?? []).filter(folder => folder.id !== fromGroupId && folder.state === 'active')

  const move = async (target: IdentityGroup) => {
    setBusyId(target.id); setError('')
    try { await moveMembership(membershipId, target.id); onMoved(target); onClose() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not move the photo.') } finally { setBusyId(null) }
  }

  return (
    <Modal title="Move to another folder" onClose={onClose} busy={busyId !== null}>
      <p className="text-xs">This photo is filed here by mistake? Choose the person it shows.{fromCount <= 1 ? ' It is the last photo in this folder, so the folder will be deleted.' : ''}</p>
      {folders.loading && <p className="text-xs flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading folders…</p>}
      {folders.error && <p role="alert" className="text-xs text-red-500">{folders.error}</p>}
      {!folders.loading && !folders.error && others.length === 0 && <p className="text-xs">There is no other folder to move it to.</p>}
      <ul className="space-y-1.5">
        {others.map(folder => (
          <li key={folder.id}>
            <button type="button" onClick={() => void move(folder)} disabled={busyId !== null} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-line bg-surface-mute hover:border-accent/40 text-left cursor-pointer disabled:opacity-60">
              <Users className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-ink truncate">{folder.display_name}</span><span className="block text-[11px] text-ink-faint">{folder.member_count} photo{folder.member_count === 1 ? '' : 's'}</span></span>
              {busyId === folder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : busyId === null ? null : <Check className="w-4 h-4 opacity-0" />}
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    </Modal>
  )
}
