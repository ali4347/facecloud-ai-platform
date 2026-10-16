import { mockGroups, mockImages } from '../data/mock'
import { ApiError } from './api/client'
import {
  getIdentityGroup, listGroupImages, listIdentityGroups,
  type IdentityGroup, type IdentityGroupImage,
} from './api/identities'
import type { Page } from './api/images'
import { useApiResource, type AsyncState } from './useApiResource'

/**
 * A Person Folder as the screens draw it, whether it came from the API or from the demo data,
 * so the card and the page never need to know which.
 */
export interface FolderView {
  id: string
  label: string
  imageCount: number
  updatedAt: string
  createdAt: string
  /** Average match confidence as a percentage; null when the backend has none (never invented). */
  confidence: number | null
  /** Photos whose thumbnails make up the card: up to four, live data only. */
  coverImageIds: number[]
  /** Demo data only: a colour block standing in for a photo. */
  demoCover?: { color: string; dimensions: string }
}

export const folderFromApi = (group: IdentityGroup): FolderView => ({
  id: String(group.id),
  label: group.display_name,
  imageCount: group.member_count,
  updatedAt: group.updated_at,
  createdAt: group.created_at,
  confidence: group.matching_confidence,
  coverImageIds: group.cover_images.map(cover => cover.id),
})

function demoFolders(): FolderView[] {
  return mockGroups.map(group => {
    const representative = mockImages.find(image => image.id === group.representative_image_id)
    return {
      id: group.id,
      label: group.label,
      imageCount: group.imageCount,
      updatedAt: group.lastUpdated,
      createdAt: group.createdDate,
      confidence: group.matchingConfidence,
      coverImageIds: [],
      demoCover: {
        color: representative?.thumbnail ?? group.coverImages[0] ?? '#FB923C',
        dimensions: representative?.dimensions ?? '',
      },
    }
  })
}

export function usePersonFolders(): AsyncState<FolderView[]> {
  return useApiResource(
    async signal => (await listIdentityGroups(signal)).map(folderFromApi),
    demoFolders,
    [],
  )
}

export function usePersonFolder(groupId: number): AsyncState<FolderView> {
  return useApiResource(
    async signal => {
      try {
        return folderFromApi(await getIdentityGroup(groupId, signal))
      } catch (caught) {
        /* The backend answers 404 for a folder that is not yours exactly as for one that does not exist, and its
           raw wording ("No IdentityGroup matches the given query") is not for a person to read. */
        if (caught instanceof ApiError && caught.isNotFound) throw new Error('This folder could not be found.')
        throw caught
      }
    },
    () => demoFolders()[0],
    [groupId],
    { skip: Number.isNaN(groupId) },
  )
}

export function useFolderImages(groupId: number, page: number): AsyncState<Page<IdentityGroupImage>> {
  return useApiResource(
    signal => listGroupImages(groupId, page, signal),
    () => ({ count: 0, next: null, previous: null, results: [] }),
    [groupId, page],
    { skip: Number.isNaN(groupId) },
  )
}
