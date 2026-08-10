import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, ChevronRight } from 'lucide-react'
import { PageTitle, Spinner } from '@/components/ui'
import { getActivityLog } from '@/services/complaints'
import type { ActivityLogEntry } from '@/types'
import { formatDateTime } from '@/utils'

export function AdminNotificationsPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getActivityLog().then((logs) => {
      setItems(logs)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <PageTitle title={t('admin.notifications')} />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-vc-border bg-vc-card p-8 text-center max-w-lg">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-vc-accent/15 text-vc-accent mb-4">
            <Bell className="h-7 w-7" />
          </span>
          <p className="font-semibold text-white mb-2">{t('admin.notificationsEmpty')}</p>
          <p className="text-sm text-vc-muted">{t('admin.notificationsHint')}</p>
        </div>
      ) : (
        <ul className="space-y-2 max-w-2xl">
          {items.map((log) => {
            const body = (
              <>
                <span className="mt-0.5 inline-flex rounded-full border border-vc-accent/30 bg-vc-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vc-accent">
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-slate-200">{log.details}</span>
                  <span className="block text-xs text-vc-muted mt-1">
                    {log.actor}
                    {log.complaintId ? ` · ${log.complaintId}` : ''}
                  </span>
                  <span className="block text-[11px] text-vc-muted mt-1.5">
                    {formatDateTime(log.createdAt)}
                  </span>
                </span>
                {log.complaintId ? (
                  <ChevronRight className="h-4 w-4 text-vc-muted shrink-0 mt-1" />
                ) : null}
              </>
            )

            const className =
              'flex items-start gap-3 rounded-2xl border border-vc-border bg-vc-card p-4 transition hover:border-vc-accent/40'

            return (
              <li key={log.id}>
                {log.complaintId ? (
                  <Link to={`/admin/complaints/${log.complaintId}`} className={className}>
                    {body}
                  </Link>
                ) : (
                  <div className={className}>{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
