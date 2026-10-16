import { apiFetch, apiFetchBlob } from './client'

/** One thing a person can agree to. Today there is exactly one: face grouping. */
export interface ConsentPurposeStatus {
  purpose: string
  label: string
  /** The latest answer was yes. */
  granted: boolean
  /** Yes, and given against the privacy policy that is current now. */
  active: boolean
  policy_version: string | null
  updated_at: string | null
}

export interface ConsentStatus {
  /** False on a server where consent is not enforced (development only). */
  required: boolean
  current_policy_version: string
  purposes: ConsentPurposeStatus[]
}

export const FACE_PURPOSE = 'face_identity'

export function getConsentStatus(signal?: AbortSignal): Promise<ConsentStatus> {
  return apiFetch<ConsentStatus>('/api/privacy/consents/', { signal })
}

/**
 * Say yes or no to face grouping. A "no" can also ask the server to delete the
 * face data it already holds — that deletes the person's Person Folders, their
 * edit history and exports, so the screen asks before sending it.
 */
export function setFaceConsent(
  granted: boolean,
  options: { policyVersion: string; eraseFacialData?: boolean },
): Promise<ConsentStatus> {
  return apiFetch<ConsentStatus>('/api/privacy/consents/', {
    body: {
      purpose: FACE_PURPOSE,
      granted,
      policy_version: options.policyVersion,
      erase_facial_data: granted ? false : Boolean(options.eraseFacialData),
    },
  })
}

/** The person's own data as a JSON file. Face templates are counted, never included. */
export function downloadMyData(): Promise<Blob> {
  return apiFetchBlob('/api/privacy/export/')
}

/** What face data is stored for the person, as counts (the data itself is never returned). */
export interface FacialDataCounts {
  analyses: number
  faces: number
  memberships: number
  groups?: number
  changes?: number
  exports?: number
}

export async function getFacialDataCounts(): Promise<FacialDataCounts> {
  const data = await apiFetch<{ stored: FacialDataCounts }>('/api/privacy/facial-data/')
  return data.stored
}

/** Permanently delete the person's face data and Person Folders. The server insists on `confirm`. */
export function eraseFacialData(): Promise<unknown> {
  return apiFetch('/api/privacy/facial-data/', { method: 'DELETE', body: { confirm: true } })
}
