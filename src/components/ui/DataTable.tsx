import { cn } from '../../lib/utils'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
  mono?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  className?: string
  emptyMessage?: string
  getKey?: (row: T) => string
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, className, emptyMessage = 'No data found', getKey
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="fc-table w-full">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={String(col.key)} className={cn(col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-sm text-ink-faint">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={getKey ? getKey(row) : i} className="transition-colors duration-100">
                {columns.map(col => (
                  <td key={String(col.key)} className={cn(col.className, col.mono && 'font-mono text-[11px]')}>
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? '—')
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
