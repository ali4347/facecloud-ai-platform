import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
      <input
        type="text"
        className="fc-input pl-10 pr-4"
        {...props}
      />
    </div>
  )
}
