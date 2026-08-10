import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, ChevronRight } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { searchComplaints } from '@/services/complaints'
import { formatDateTime, getStatusBadgeClass, statusLabel } from '@/utils'
import type { ComplaintStatus } from '@/constants'

interface CitizenAlert {
  id: string
  complaintId: string
  title: string
  description?: string
  status: ComplaintStatus
  createdAt: string
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const { citizen } = useApp()
  const [alerts, setAlerts] = useState<CitizenAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!citizen?.mobile) {
      setLoading(false)
      return
    }
    void searchComplaints({ mobile: citizen.mobile }).then((list) => {
      const items: CitizenAlert[] = list.flatMap((c) =>
        (c.timeline || [])
          .filter((ev) => !ev.isInternal)
          .map((ev) => ({
            id: `${c.id}_${ev.id}`,
            complaintId: c.complaintId,
            title: ev.title || statusLabel(ev.status),
            description: ev.description,
            status: ev.status,
            createdAt: ev.createdAt,
          })),
      )
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      setAlerts(items)
      setLoading(false)
    })
  }, [citizen?.mobile])

  return (
    <div className="px-4 max-w-lg mx-auto py-6 md:py-10">
      <h1 className="font-display text-2xl font-bold dark:text-white text-light-text mb-4">
        {t('notifications.title')}
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-3xl dark:bg-vc-card bg-white border dark:border-vc-border border-light-border p-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-vc-accent/15 text-vc-accent mb-4">
            <Bell className="h-7 w-7" />
          </span>
          <p className="font-semibold dark:text-white text-light-text mb-2">{t('notifications.empty')}</p>
          <p className="text-sm text-vc-muted">{t('notifications.comingSoon')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                to={`/complaints/${alert.complaintId}`}
                className="flex items-start gap-3 rounded-2xl border dark:border-vc-border border-light-border dark:bg-vc-card bg-white p-4 active:scale-[0.99] transition hover:border-vc-accent/40"
              >
                <span
                  className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(alert.status)}`}
                >
                  {statusLabel(alert.status)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-sm dark:text-white text-light-text truncate">
                    {alert.complaintId}
                  </span>
                  <span className="block text-sm dark:text-slate-200 text-slate-700 mt-0.5">
                    {alert.title}
                  </span>
                  {alert.description ? (
                    <span className="block text-xs text-vc-muted mt-1 line-clamp-2">
                      {alert.description}
                    </span>
                  ) : null}
                  <span className="block text-[11px] text-vc-muted mt-2">
                    {formatDateTime(alert.createdAt)}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-vc-muted shrink-0 mt-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
