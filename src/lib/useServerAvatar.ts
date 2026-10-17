import { useEffect } from 'react'
import { loadAccountProfile, fetchAvatarBlob } from './api/account'
import { getAvatar, setAvatar } from './avatar'

const markerKey = (email: string) => `facecloud_avatar_src:${email.toLowerCase()}`

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(blob)
})

/** Remember which server picture the local copy was made from. */
export function rememberAvatarSource(email: string, source: string | null): void {
  try {
    if (source) localStorage.setItem(markerKey(email), source)
    else localStorage.removeItem(markerKey(email))
  } catch { /* storage blocked: the picture still shows from memory */ }
}

/**
 * Keep the picture on this device in step with the one on the account, so
 * signing in on another device shows it too. Does nothing on a backend that has
 * no picture support, and never replaces a colour the person picked here.
 */
export function useServerAvatar(email: string, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !email) return
    const ctl = new AbortController()
    ;(async () => {
      try {
        const profile = await loadAccountProfile(ctl.signal)
        if (!('avatar_url' in profile)) return
        const known = localStorage.getItem(markerKey(email))
        if (profile.avatar_url) {
          if (known === profile.avatar_url && getAvatar(email)?.kind === 'photo') return
          const dataUrl = await blobToDataUrl(await fetchAvatarBlob())
          if (ctl.signal.aborted) return
          setAvatar(email, { kind: 'photo', dataUrl })
          rememberAvatarSource(email, profile.avatar_url)
        } else if (known) {
          setAvatar(email, null)
          rememberAvatarSource(email, null)
        }
      } catch { /* offline or not signed in: keep what is on the device */ }
    })()
    return () => ctl.abort()
  }, [email, enabled])
}
