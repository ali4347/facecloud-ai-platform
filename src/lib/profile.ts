import { useCallback, useEffect, useState } from 'react'

/**
 * Profile details beyond the identity on the session.
 *
 * Everything here is optional: FaceCloud is for anyone with photos to clean up,
 * not for one kind of organisation, so the form asks for nothing it does not
 * need. The display name and email stay on the session, which keeps one copy of
 * each rather than two that can drift apart.
 */
export interface Profile {
  organization: string
  jobTitle: string
  phone: string
  country: string
}

export const EMPTY_PROFILE: Profile = { organization: '', jobTitle: '', phone: '', country: '' }

const CHANGE_EVENT = 'facecloud:profile'
const keyFor = (email: string) => `facecloud_profile:${email.toLowerCase()}`

export function getProfile(email: string): Profile {
  if (!email) return EMPTY_PROFILE
  try {
    const raw = localStorage.getItem(keyFor(email))
    if (!raw) return EMPTY_PROFILE
    const parsed = JSON.parse(raw)
    return {
      organization: typeof parsed?.organization === 'string' ? parsed.organization : '',
      jobTitle:     typeof parsed?.jobTitle === 'string' ? parsed.jobTitle : '',
      phone:        typeof parsed?.phone === 'string' ? parsed.phone : '',
      country:      typeof parsed?.country === 'string' ? parsed.country : '',
    }
  } catch {
    return EMPTY_PROFILE
  }
}

export function saveProfile(email: string, profile: Profile): void {
  if (!email) return
  try {
    localStorage.setItem(keyFor(email), JSON.stringify(profile))
  } catch {
    throw new Error('Could not save — browser storage is full or blocked.')
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: email }))
}

export function useProfile(email: string): Profile {
  const [profile, setProfile] = useState<Profile>(() => getProfile(email))

  const refresh = useCallback(() => setProfile(getProfile(email)), [email])

  useEffect(() => {
    refresh()
    const onChange = (e: Event) => {
      if ((e as CustomEvent<string>).detail === email) refresh()
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [email, refresh])

  return profile
}
