import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { PageTitle, Spinner, Badge } from '@/components/ui'
import { VillageMap } from '@/components/map/VillageMap'
import { getComplaints } from '@/services/complaints'
import { useApp } from '@/contexts/AppContext'
import type { Complaint } from '@/types'
import { CATEGORY_LABELS } from '@/constants'
import { getStatusBadgeClass, statusLabel } from '@/utils'

export function MapPage() {
  const { t } = useTranslation()
  const { village } = useApp()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getComplaints().then((c) => {
      setComplaints(c)
      setLoading(false)
    })
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <PageTitle title={t('nav.map')} />
        {village.mapsUrl ? (
          <a
            href={village.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:underline mt-1"
          >
            Open in Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
      <p className="text-vc-muted mb-1 -mt-2">
        {village.name} ({village.nameTa}), {village.district} — {village.pincode}
      </p>
      <p className="text-vc-muted mb-6 text-sm">
        Real satellite map · Red = pending · Yellow = in progress · Green = resolved
      </p>
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="h-[min(55vh,420px)]">
            <VillageMap complaints={complaints} height="100%" />
          </div>
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {complaints.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                to={`/complaints/${c.complaintId}`}
                className="rounded-xl border dark:border-vc-border border-light-border dark:bg-vc-card bg-white p-3 hover:border-sky-500/40 transition"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-sm dark:text-white text-light-text">
                    {c.complaintId}
                  </span>
                  <Badge className={getStatusBadgeClass(c.status)}>{statusLabel(c.status)}</Badge>
                </div>
                <p className="text-xs text-vc-muted">
                  {CATEGORY_LABELS[c.category]} · {c.location.address}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
