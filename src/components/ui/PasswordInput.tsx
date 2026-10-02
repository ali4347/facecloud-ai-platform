import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Extra classes for the input itself; the wrapper handles positioning. */
  className?: string
  /** Leading icon, for the login screens that show a padlock. */
  leading?: React.ReactNode
}

/**
 * A password field with a reveal toggle.
 *
 * Typing a password you cannot see is the main reason people mistype one, so
 * every password field in the app uses this. The toggle is a real button with a
 * label that says which way it goes, and it is skipped in the tab order so it
 * does not sit between the field and the submit button.
 */
export function PasswordInput({ className, leading, id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="relative">
      {leading}
      <input
        {...props}
        id={inputId}
        type={visible ? 'text' : 'password'}
        className={cn('pr-11', className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md
                   text-ink-faint hover:text-ink transition-colors cursor-pointer"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
