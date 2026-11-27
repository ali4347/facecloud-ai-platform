import { getEnhancementResult } from './api/enhancements'
import { getEdit } from './api/editor'
import type { ArtifactType } from './api/downloads'

/** The photo and file a refused address was for, when it names one. ZIPs and share links do not. */
export async function resolveRefusedFile(path: string): Promise<{ imageId: number; artifact: ArtifactType; artifactId?: number } | null> {
  const bare = path.split('?')[0]
  let match = bare.match(/^\/api\/images\/(\d+)\/(?:preprocessing\/)?download\/$/)
  if (match) return { imageId: Number(match[1]), artifact: 'original' }
  match = bare.match(/^\/api\/enhancements\/results\/(\d+)\/download\/$/)
  if (match) return { imageId: (await getEnhancementResult(Number(match[1]))).image, artifact: 'enhanced' }
  match = bare.match(/^\/api\/enhancements\/edits\/(\d+)\/download\/$/)
  if (match) {
    const edit = await getEdit(Number(match[1]))
    return { imageId: (await getEnhancementResult(edit.enhancement_result)).image, artifact: 'edited', artifactId: edit.id }
  }
  return null
}
