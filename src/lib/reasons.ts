export interface ReasonInfo {
  title: string
  /** What it means and what to do about it, in a sentence. */
  hint: string
}

/**
 * The backend names why a photo was not accepted with short codes. These say what each one means in
 * plain words, with the limits the checks actually use, so nobody has to guess what "severe_blur" is.
 */
const KNOWN: Record<string, ReasonInfo> = {
  // Rejected
  face_too_small: { title: 'Face too small in the frame', hint: 'The face is under about 160 pixels across and under 6% of the photo. Move closer or crop the photo around the face.' },
  severe_blur: { title: 'Too blurry', hint: 'The photo is out of focus or shaken. Take it again holding the camera steady.' },
  resolution_too_low: { title: 'Photo too small', hint: 'The shorter side is under 240 pixels. Use the original, larger file.' },
  severe_underexposure: { title: 'Too dark', hint: 'The photo is very dark. Use more light, or enhance it from a brighter original.' },
  severe_overexposure: { title: 'Too bright', hint: 'The photo is washed out. Avoid strong direct light or a bright background.' },
  contrast_too_low: { title: 'Too flat', hint: 'There is almost no difference between light and dark areas, often from haze or a screen photo.' },
  face_validation_rejected: { title: 'Face check failed', hint: 'The face check could not accept this photo.' },
  detector_failed: { title: 'Face check could not run', hint: 'The face detector failed on this file. Try uploading it again.' },
  // Sent for review
  borderline_blur: { title: 'A little blurry', hint: 'Close to the sharpness limit, so a moderator will look at it.' },
  borderline_resolution: { title: 'Low resolution', hint: 'The shorter side is under 480 pixels; a larger file gives better results.' },
  underexposed: { title: 'Rather dark', hint: 'Dark enough that a moderator will look at it.' },
  overexposed: { title: 'Rather bright', hint: 'Bright enough that a moderator will look at it.' },
  borderline_contrast: { title: 'Low contrast', hint: 'Close to the contrast limit, so a moderator will look at it.' },
  excessive_noise: { title: 'Very grainy', hint: 'Heavy noise, usually from low light.' },
  overall_score_below_acceptance: { title: 'Overall quality below the bar', hint: 'No single check failed, but the overall score is under the acceptance level.' },
  face_validation_required: { title: 'Face needs a manual look', hint: 'The face check was not sure, so a moderator will decide.' },
  no_face_detected: { title: 'No clear face found', hint: 'No confident, frontal face was detected. Use a photo where the face is clearly visible and facing the camera.' },
  large_group_detected: { title: 'More than five faces', hint: 'Group photos with more than five people are sent for review.' },
  group_face_too_small: { title: 'Faces too small in a group photo', hint: 'One or more faces in the group are too small to process reliably.' },
  face_off_center: { title: 'Face near the edge', hint: 'The face is close to the border of the photo. Centre it in the frame.' },
}

/** A code from the backend, or a sentence it wrote itself (for example about an unsupported file). */
export function explainReason(code: string): ReasonInfo {
  const known = KNOWN[code.trim()]
  if (known) return known
  // Not a code: already a sentence meant for people.
  if (/\s/.test(code.trim())) return { title: code.trim().replace(/\.$/, ''), hint: '' }
  const words = code.replace(/_/g, ' ').trim()
  return { title: words.charAt(0).toUpperCase() + words.slice(1), hint: '' }
}

/** The codes that reject a photo outright; anything else is a reason to send it to review. */
export const REJECTING_CODES = new Set([
  'face_too_small', 'severe_blur', 'resolution_too_low', 'severe_underexposure', 'severe_overexposure',
  'contrast_too_low', 'face_validation_rejected', 'detector_failed',
])
