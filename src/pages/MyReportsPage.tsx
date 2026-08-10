import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FilePlus2 } from 'lucide-react'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import { Spinner } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { searchComplaints } from '@/services/complaints'
import type { Complaint } from '@/types'

export function MyReportsPage() {
  const { t } = useTranslation()
  const { citizen } = useApp()
  const [list, setList] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!citizen?.mobile) {
      setLoading(false)
      return
    }
    void searchComplaints({ mobile: citizen.mobile }).then((r) => {
      setList(r)
      setLoading(false)
    })
  }, [citizen?.mobile])

  return (
    <div className="px-4 max-w-lg mx-auto py-6 md:py-10 md:max-w-4xl">
      <h1 className="font-display text-2xl font-bold dark:text-white text-light-text mb-4">
        {t('myReports.title')}
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl dark:bg-vc-card bg-white border dark:border-vc-border border-light-border p-8 text-center">
          <p className="text-vc-muted mb-5">{t('myReports.empty')}</p>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 to-sky-400 text-slate-900 font-semibold px-5 py-3"
          >
            <FilePlus2 className="h-5 w-5" />
            {t('myReports.reportFirst')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <ComplaintCard key={c.id} complaint={c} showTimeline />
          ))}
        </div>
      )}
    </div>
  )
}
