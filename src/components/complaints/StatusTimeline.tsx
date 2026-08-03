import { COMPLAINT_STATUSES, STATUS_LABELS, type ComplaintStatus } from '@/constants'
import { cn } from '@/utils'
import { Check } from 'lucide-react'

export function StatusTimeline({
  current,
  compact = false,
}: {
  current: ComplaintStatus
  compact?: boolean
}) {
  const currentIdx = COMPLAINT_STATUSES.indexOf(current)

  return (
    <ol
      className={cn(
        'flex w-full',
        compact ? 'gap-1' : 'flex-col sm:flex-row sm:items-start gap-3 sm:gap-0',
      )}
      aria-label="Complaint workflow"
    >
      {COMPLAINT_STATUSES.map((status, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        return (
          <li
            key={status}
            className={cn(
              'flex sm:flex-1 items-center sm:flex-col sm:items-center gap-2 relative',
              compact && 'flex-col flex-1 items-center',
            )}
          >
            {i < COMPLAINT_STATUSES.length - 1 && !compact ? (
              <span
                className={cn(
                  'hidden sm:block absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5',
                  i < currentIdx ? 'bg-vc-teal' : 'bg-vc-border',
                )}
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold shrink-0',
                done
                  ? 'bg-vc-teal/20 border-vc-teal text-vc-teal'
                  : 'bg-transparent border-vc-border text-vc-muted',
                active && 'glow-accent border-vc-accent text-vc-accent bg-vc-accent/10',
              )}
            >
              {done && !active ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            {!compact ? (
              <span
                className={cn(
                  'text-xs sm:text-center font-medium',
                  active ? 'text-vc-accent' : done ? 'dark:text-white text-light-text' : 'text-vc-muted',
                )}
              >
                {STATUS_LABELS[status]}
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
