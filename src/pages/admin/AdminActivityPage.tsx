import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, PageTitle, Spinner, EmptyState } from '@/components/ui'
import { getActivityLog } from '@/services/complaints'
import type { ActivityLogEntry } from '@/types'
import { formatDateTime } from '@/utils'

export function AdminActivityPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getActivityLog().then((l) => {
      setLogs(l)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <PageTitle title={t('admin.activity')} />
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState message="No activity yet" />
      ) : (
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-vc-border">
            {logs.map((log) => (
              <li key={log.id} className="px-5 py-4 hover:bg-white/[0.02]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-vc-accent">
                    {log.action.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-vc-muted">{formatDateTime(log.createdAt)}</span>
                </div>
                <p className="text-sm mt-1">{log.details}</p>
                <p className="text-xs text-vc-muted mt-1">{log.actor}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
