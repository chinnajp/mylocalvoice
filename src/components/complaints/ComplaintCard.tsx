import { Link } from 'react-router-dom'
import { ThumbsUp, MapPin } from 'lucide-react'
import type { Complaint } from '@/types'
import { CATEGORY_LABELS } from '@/constants'
import { Badge, Card } from '@/components/ui'
import { formatDate, getStatusBadgeClass, statusLabel } from '@/utils'
import { StatusTimeline } from './StatusTimeline'

export function ComplaintCard({ complaint, showTimeline = false }: { complaint: Complaint; showTimeline?: boolean }) {
  return (
    <Card className="hover:border-sky-500/40 transition group">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <Link
          to={`/complaints/${complaint.complaintId}`}
          className="font-display font-semibold text-lg dark:text-white text-light-text group-hover:text-sky-400 transition"
        >
          {complaint.complaintId}
        </Link>
        <Badge className={getStatusBadgeClass(complaint.status)}>{statusLabel(complaint.status)}</Badge>
      </div>
      <p className="text-sm text-vc-muted mb-1">{CATEGORY_LABELS[complaint.category]}</p>
      <p className="text-sm dark:text-slate-200 text-slate-700 line-clamp-2 mb-3">{complaint.description}</p>
      <div className="flex flex-wrap items-center gap-3 text-xs text-vc-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {complaint.location.address || 'Location set'}
        </span>
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="h-3.5 w-3.5" />
          {complaint.supporters}
        </span>
        <span>{formatDate(complaint.createdAt)}</span>
      </div>
      {showTimeline ? (
        <div className="mt-4 pt-4 border-t dark:border-vc-border border-light-border">
          <StatusTimeline current={complaint.status} compact />
        </div>
      ) : null}
    </Card>
  )
}
