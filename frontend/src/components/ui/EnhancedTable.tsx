import { type HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export interface EnhancedTableProps<T extends Record<string, unknown>> extends HTMLAttributes<HTMLTableElement> {
  data: T[]
  columns: EnhancedTableColumn<T>[]
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  onRowClick?: (row: T) => void
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  hover?: boolean
  selectable?: boolean
  selectedRows?: Set<string | number>
  onSelectionChange?: (selected: Set<string | number>) => void
  className?: string
}

export interface EnhancedTableColumn<T extends Record<string, unknown>> {
  key: string
  header: string
  render: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
  headerClassName?: string
}

export function EnhancedTable<T extends Record<string, unknown> = Record<string, unknown>>({
  data,
  columns,
  loading = false,
  error = null,
  onRetry,
  onRowClick,
  onSortChange,
  sortKey,
  sortDirection = 'asc',
  hover = true,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  className,
  ...props
}: EnhancedTableProps<T>) {
  const handleSort = (key: string) => {
    if (!columns.find((col) => col.key === key)?.sortable) return
    const newDirection = sortKey === key && sortDirection === 'desc' ? 'asc' : 'desc'
    onSortChange?.(key, newDirection)
  }

  const isSelected = (row: T) => selectedRows.has(row.id as string | number)

  const getSortIcon = (key: string) => {
    if (!sortKey || sortKey !== key) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  if (loading) {
    return (
      <div className="enhanced-table border border-border bg-surface rounded-xl">
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="enhanced-table border border-danger/20 bg-danger-soft/20 rounded-xl">
        <div className="p-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-text">Something went wrong</h3>
          <p className="mb-6 text-sm text-muted">Failed to load data: {error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-danger px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-danger/90 active:translate-y-0"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('enhanced-table border border-border bg-surface rounded-xl overflow-hidden shadow-sm', className)} {...props}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="bg-surface3">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-4 text-left">
                  <button
                    onClick={() => {
                      if (selectedRows.size === data.length) {
                        onSelectionChange?.(new Set())
                      } else {
                        onSelectionChange?.(new Set(data.map((row) => row.id as string | number)))
                      }
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded border border-border text-transparent transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {selectedRows.size === data.length && data.length > 0 && (
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-4 text-left text-xs font-medium uppercase tracking-[0.06em] text-muted',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.width && `w-[${column.width}]`,
                    column.headerClassName,
                    column.sortable && 'cursor-pointer select-none hover:text-primary',
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <span className="text-muted/60 transition-colors group-hover:text-primary">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={(row as any).id || rowIndex}
                className={cn(
                  'border-b border-border/60 transition-all duration-150',
                  hover && 'hover:bg-surface3',
                  isSelected(row) && 'bg-primary-soft border-l-2 border-primary',
                  'group',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const newSelected = new Set(selectedRows)
                        if (newSelected.has(row.id as string | number)) {
                          newSelected.delete(row.id as string | number)
                        } else {
                          newSelected.add(row.id as string | number)
                        }
                        onSelectionChange?.(newSelected)
                      }}
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border transition-all',
                        isSelected(row)
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border text-transparent hover:border-primary hover:bg-primary/10',
                      )}
                    >
                      {isSelected(row) && (
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-4 align-middle',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.className,
                    )}
                  >
                    {column.render(row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

EnhancedTable.displayName = 'EnhancedTable'