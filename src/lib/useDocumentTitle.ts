import { useEffect } from 'react'

const SITE = 'FaceCloud'

/** Names the browser tab after the page, so tabs and history can be told apart. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE}` : SITE
  }, [title])
}
