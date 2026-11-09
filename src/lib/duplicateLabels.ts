/** The words for a duplicate match, shared by the Duplicates page and the notice on a photo's page. */

const KIND: Record<string, string> = { exact: 'The same file', perceptual: 'Almost the same photo', face_region: 'The same face' }

/** What kind of match the server found (`match_type`); one this app does not know is shown as the server wrote it. */
export const matchKind = (type: string): string => KIND[type] ?? type.replace(/_/g, ' ')

const REVIEW: Record<string, { words: string; tone: string }> = {
  suspected: { words: 'To review', tone: 'text-[#D97706] border-[#F59E0B]/35 bg-[#F59E0B]/10 [html[data-theme=light]_&]:text-[#B45309]' },
  confirmed: { words: 'Same photo', tone: 'text-[#10B981] border-[#10B981]/35 bg-[#10B981]/10 [html[data-theme=light]_&]:text-[#047857]' },
  not_duplicate: { words: 'Not a duplicate', tone: 'text-ink-mute border-line bg-surface-mute' },
}

/** The person's decision on a match (`review_status`), in words, with the badge colours for it. */
export const reviewWords = (status: string): string => REVIEW[status]?.words ?? status.replace(/_/g, ' ')
export const reviewTone = (status: string): string => REVIEW[status]?.tone ?? 'text-ink-mute border-line bg-surface-mute'
