import { apiFetch } from './client'

/**
 * Ask the backend to look at one photo's faces and file it under a Person Folder.
 *
 * The work is queued (the answer is 202 and carries no result); the folders change
 * when it finishes. It refuses with a plain 400 when the person has not agreed to
 * face grouping, and answers 404 for a photo that is not theirs or was rejected.
 */
export function requestIdentityAnalysis(imageId: number, force = false): Promise<unknown> {
  return apiFetch(`/api/identities/images/${imageId}/`, { method: 'POST', body: { force } })
}
