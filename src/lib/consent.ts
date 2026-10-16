import { useEffect, useSyncExternalStore } from 'react'
import { USE_API } from './api/config'
import { getConsentStatus, setFaceConsent, FACE_PURPOSE } from './api/privacy'
import type { ConsentStatus } from './api/privacy'
import { getSession } from './session'

/*
 * Face-grouping consent, shared by the popup, the Person Folders banner and the
 * Settings card, so all three always agree and the answer is fetched once.
 *
 * The backend refuses to analyse faces for anyone who has not said yes, and says
 * so only as an empty list of Person Folders. This is what lets the screens say it
 * out loud. Nothing here runs in the demo build: there is no server to ask.
 */
interface State {
  status: ConsentStatus | null
  /** Whose answer `status` is, so a different sign-in is never shown the last person's. */
  email: string | null
  loading: boolean
  busy: boolean
  error: string | null
}

let state: State = { status: null, email: null, loading: false, busy: false, error: null }
const listeners = new Set<() => void>()

function update(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach(listener => listener())
}

const messageOf = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

async function load(force = false) {
  if (!USE_API) return
  const email = getSession()?.email ?? null
  if (!email) return
  if (!force && (state.loading || (state.email === email && state.status))) return
  update({ loading: true, error: null, email })
  try {
    update({ status: await getConsentStatus(), loading: false })
  } catch (error) {
    update({ loading: false, status: null, error: messageOf(error, 'Could not read your privacy settings.') })
  }
}

async function answer(granted: boolean, eraseFacialData = false): Promise<boolean> {
  if (!state.status) return false
  update({ busy: true, error: null })
  try {
    const next = await setFaceConsent(granted, {
      policyVersion: state.status.current_policy_version,
      eraseFacialData,
    })
    update({ status: next, busy: false })
    return true
  } catch (error) {
    update({ busy: false, error: messageOf(error, 'Could not save your choice. Please try again.') })
    return false
  }
}

export function useFaceConsent() {
  const snapshot = useSyncExternalStore(
    listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    () => state,
  )
  useEffect(() => { void load() }, [])

  const face = snapshot.status?.purposes.find(p => p.purpose === FACE_PURPOSE)
  const required = Boolean(snapshot.status?.required)
  const active = Boolean(face?.active)
  return {
    /** The server enforces consent and this person has not (validly) given it. */
    needsConsent: USE_API && snapshot.status !== null && required && !active,
    /** They said yes once, but the privacy policy has changed since. */
    needsReconfirm: required && Boolean(face?.granted) && !active,
    active,
    policyVersion: snapshot.status?.current_policy_version ?? '',
    loading: snapshot.loading,
    busy: snapshot.busy,
    error: snapshot.error,
    allow: () => answer(true),
    withdraw: (eraseFacialData: boolean) => answer(false, eraseFacialData),
    reload: () => load(true),
  }
}
