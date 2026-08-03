import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Button, Card, Input, Label, PageTitle, Select, EmptyState, Spinner } from '@/components/ui'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import { CATEGORY_LABELS, COMPLAINT_CATEGORIES, type ComplaintCategory } from '@/constants'
import { searchComplaints } from '@/services/complaints'
import type { Complaint } from '@/types'

export function TrackPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [complaintId, setComplaintId] = useState(params.get('id') || '')
  const [mobile, setMobile] = useState('')
  const [category, setCategory] = useState<ComplaintCategory | ''>('')
  const [results, setResults] = useState<Complaint[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const onSearch = async (e?: { preventDefault: () => void }) => {
    e?.preventDefault()
    setLoading(true)
    setSearched(true)
    if (complaintId) setParams({ id: complaintId })
    const list = await searchComplaints({
      complaintId: complaintId || undefined,
      mobile: mobile || undefined,
      category: category || undefined,
    })
    setResults(list)
    setLoading(false)
  }

  useEffect(() => {
    if (params.get('id')) void onSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial URL id only
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <PageTitle title={t('track.title')} />
      <p className="text-vc-muted mb-8 -mt-4">{t('track.subtitle')}</p>

      <Card className="mb-8">
        <form onSubmit={(e) => void onSearch(e)} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Complaint ID</Label>
            <Input
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder={t('track.placeholder')}
            />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile" />
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory | '')}
            >
              <option value="">All</option>
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            <Search className="h-4 w-4" />
            {t('track.search')}
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : null}

      {!loading && searched && results?.length === 0 ? <EmptyState message={t('common.noResults')} /> : null}

      <div className="grid gap-4">
        {results?.map((c) => (
          <ComplaintCard key={c.id} complaint={c} showTimeline />
        ))}
      </div>
    </div>
  )
}
