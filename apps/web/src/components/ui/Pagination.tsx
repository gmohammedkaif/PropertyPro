import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/buttonVariants'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
}

function generatePages(current: number, total: number, sibling: number): (number | string)[] {
  const pages: (number | string)[] = []
  const totalPages = total
  const totalNumbers = sibling * 2 + 5

  if (totalPages <= totalNumbers) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  const leftSibling = Math.max(2, current - sibling)
  const rightSibling = Math.min(totalPages - 1, current + sibling)

  const showLeftDots = leftSibling > 2
  const showRightDots = rightSibling < totalPages - 1

  if (!showLeftDots && showRightDots) {
    const rightItemCount = 3 + 2 * sibling
    for (let i = 1; i <= rightItemCount; i++) {
      pages.push(i)
    }
    pages.push('ellipsis')
    pages.push(totalPages)
  } else if (showLeftDots && showRightDots) {
    pages.push(1)
    pages.push('ellipsis')
    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i)
    }
    pages.push('ellipsis')
    pages.push(totalPages)
  } else {
    const leftItemCount = 3 + 2 * sibling
    pages.push(1)
    pages.push('ellipsis')
    for (let i = totalPages - leftItemCount + 1; i <= totalPages; i++) {
      pages.push(i)
    }
  }

  return pages
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  const pages = generatePages(currentPage, totalPages, siblingCount)

  return (
    <div className="flex items-center justify-between py-4 text-sm">
      <div className="text-sm text-muted">
        Page {currentPage} of {totalPages}
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'gap-1')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>

        <div className="flex items-center gap-0.5">
          {pages.map((page, index) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 w-8 items-center justify-center text-muted"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page as number)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  'flex h-8 min-w-[32px] items-center justify-center rounded-md px-2 text-sm font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-bg',
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'text-text2 hover:bg-surface2 hover:text-text',
                )}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'gap-1')}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  )
}
