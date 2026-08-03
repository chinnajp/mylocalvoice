import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Input, Label, PageTitle, Select, Spinner, EmptyState } from '@/components/ui'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import {
  CATEGORY_LABELS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  STATUS_LABELS,
  type ComplaintCategory,
  type ComplaintStatus,
} from '@/constants'
import { searchComplaints } from '@/services/complaints'
import type { Complaint } from '@/types'

export function ComplaintsListPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ComplaintCategory | ''>('')
  const [status, setStatus] = useState<ComplaintStatus | ''>('')
  const [list, setList] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      void searchComplaints({ query, category, status }).then((r) => {
        setList(r)
        setLoading(false)
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [query, category, status])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <PageTitle title={t('nav.complaints')} />
      <Card className="mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Search</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID, description, area…" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory | '')}>
              <option value="">All</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ComplaintStatus | '')}>
              <option value="">All</option>
              {COMPLAINT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <EmptyState message={t('common.noResults')} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  )
}
