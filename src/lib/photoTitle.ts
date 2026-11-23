/**
 * The name a photo is shown under: who is in it and when it was added, e.g. "Ali Hassan · Nov 21, 2026, 12:46 PM".
 *
 * Built from what the app already knows (the person folders the photo is filed under, and its upload time), so the raw file name of a camera or a
 * download ("IMG_1435.jpeg", "vadim-bogulov-va5IiRWVeAQ-unsplash.jpg") is no longer the headline. The file name stays available as the tooltip, the
 * subtitle of the photo page and the name a download is saved under; nothing is renamed on the server.
 */
interface Titled {
  identity_groups?: { display_name: string }[] | null
  created_at: string
}

/** "Ali Hassan", "Ali Hassan & Sonia", "Ali Hassan, Sonia +1"; "Photo" when the photo is not in any person folder (no face, still processing, rejected). */
export function photoPeople(image: Pick<Titled, 'identity_groups'>): string {
  const names = (image.identity_groups ?? []).map(group => group.display_name.trim()).filter(Boolean)
  if (names.length === 0) return 'Photo'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} & ${names[1]}`
  return `${names[0]}, ${names[1]} +${names.length - 2}`
}

export function photoDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function photoTitle(image: Titled): string {
  const when = photoDateTime(image.created_at)
  return when ? `${photoPeople(image)} · ${when}` : photoPeople(image)
}
