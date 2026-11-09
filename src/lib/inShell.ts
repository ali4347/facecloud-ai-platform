import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

/**
 * The page sits in a stacking context of its own, below the sidebar and the floating nav, so a dialog drawn inside the page is drawn under them
 * (its Add / Confirm button ended up behind the nav). A dialog is therefore placed directly in the shell root (`.fc-app`), above them, and the glass
 * styling, which is scoped to the shell, still reaches it. Outside a shell it is drawn where it stands.
 */
export function inShell(dialog: ReactNode): ReactNode {
  const shell = document.querySelector('.fc-app')
  return shell ? createPortal(dialog, shell) : dialog
}
