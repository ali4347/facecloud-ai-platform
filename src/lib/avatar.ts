import { useCallback, useEffect, useState } from 'react'

export interface AvatarPreset {
  id: string
  label: string
  from: string
  to: string
}

export type Avatar =
  | { kind: 'preset'; id: string }
  | { kind: 'photo'; dataUrl: string }

/** Colour presets, so someone can pick a look without uploading anything. */
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'orange',  label: 'Orange',  from: '#F97316', to: '#EA580C' },
  { id: 'amber',   label: 'Amber',   from: '#FBBF24', to: '#D97706' },
  { id: 'emerald', label: 'Emerald', from: '#34D399', to: '#047857' },
  { id: 'teal',    label: 'Teal',    from: '#2DD4BF', to: '#0F766E' },
  { id: 'sky',     label: 'Sky',     from: '#38BDF8', to: '#0369A1' },
  { id: 'indigo',  label: 'Indigo',  from: '#818CF8', to: '#4338CA' },
  { id: 'violet',  label: 'Violet',  from: '#A78BFA', to: '#6D28D9' },
  { id: 'rose',    label: 'Rose',    from: '#FB7185', to: '#BE123C' },
  { id: 'slate',   label: 'Slate',   from: '#94A3B8', to: '#334155' },
]

export function findPreset(id: string): AvatarPreset | undefined {
  return AVATAR_PRESETS.find(p => p.id === id)
}

const CHANGE_EVENT = 'facecloud:avatar'
const keyFor = (email: string) => `facecloud_avatar:${email.toLowerCase()}`

/**
 * The avatar is stored per account rather than globally, so signing in as
 * someone else does not inherit the previous person's picture.
 *
 * There is no backend yet, so an uploaded photo lives in localStorage as a data
 * URL. It is downscaled first — see `fileToAvatarDataUrl` — because a phone
 * photo would otherwise blow the ~5 MB storage quota on its own.
 */
export function getAvatar(email: string): Avatar | null {
  if (!email) return null
  try {
    const raw = localStorage.getItem(keyFor(email))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.kind === 'photo' && typeof parsed.dataUrl === 'string') return parsed
    if (parsed?.kind === 'preset' && typeof parsed.id === 'string') return parsed
    return null
  } catch {
    return null
  }
}

export function setAvatar(email: string, avatar: Avatar | null): void {
  if (!email) return
  try {
    if (avatar) localStorage.setItem(keyFor(email), JSON.stringify(avatar))
    else localStorage.removeItem(keyFor(email))
  } catch {
    // Quota or blocked storage. The caller surfaces this; nothing is persisted.
    throw new Error('Could not save the avatar — browser storage is full or blocked.')
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: email }))
}

/** Read and change the avatar from a component, kept in step across surfaces. */
export function useAvatar(email: string): [Avatar | null, (next: Avatar | null) => void] {
  const [avatar, setLocal] = useState<Avatar | null>(() => getAvatar(email))

  useEffect(() => {
    setLocal(getAvatar(email))
  }, [email])

  useEffect(() => {
    const onChange = (e: Event) => {
      if ((e as CustomEvent<string>).detail === email) setLocal(getAvatar(email))
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [email])

  const update = useCallback((next: Avatar | null) => {
    setAvatar(email, next)
    setLocal(next)
  }, [email])

  return [avatar, update]
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const OUTPUT_SIZE = 256

/**
 * Turn a picked file into a small square data URL.
 *
 * Centre-crops to a square and downscales to 256px, then encodes as JPEG, so
 * what gets stored is tens of kilobytes rather than the several megabytes a
 * camera photo arrives as.
 */
export function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('That file is not an image. Pick a JPG, PNG or WebP.'))
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('That image is larger than 8 MB. Pick a smaller one.'))
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = OUTPUT_SIZE
        canvas.height = OUTPUT_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not read the image.')

        // Centre crop to a square before scaling, so faces are not stretched.
        const side = Math.min(img.naturalWidth, img.naturalHeight)
        const sx = (img.naturalWidth - side) / 2
        const sy = (img.naturalHeight - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

        resolve(canvas.toDataURL('image/jpeg', 0.82))
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Could not read the image.'))
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That image could not be opened. It may be corrupt.'))
    }

    img.src = url
  })
}
