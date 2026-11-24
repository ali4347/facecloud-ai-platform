/**
 * The name of the outside service that does the "Pro" AI enhancement is not shown anywhere in the app: the server's own wording (its summary sentence, an
 * engine id, a failure reason) mentions it, so every API answer is passed through here before the screens see it. It becomes "FaceCloud AI".
 * Only letters, spaces, underscores and hyphens are matched and no quote or bracket is added, so the answer is still valid JSON afterwards.
 */
export const BRAND_AI = 'FaceCloud AI'

const VENDOR = /deep[\s_-]*image(?:[\s_-]*(?:auto[\s_-]*enhance(?:[\s_-]*(?:normal|strong|light|soft|high|low|max))?|api[\s_-]*key|api|ai))?/gi
const REDUNDANT = /FaceCloud AI,?\s+an?\s+(?:cloud|external|third[\s-]party)\s+AI\s+(?:model|service)/gi

export function scrubVendor(text: string): string {
  return text.replace(VENDOR, BRAND_AI).replace(REDUNDANT, BRAND_AI)
}
