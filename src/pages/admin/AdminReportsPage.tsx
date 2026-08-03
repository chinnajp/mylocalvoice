import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { Button, Card, Label, PageTitle, Select, Spinner, StatCard } from '@/components/ui'
import { getComplaints, getDashboardStats } from '@/services/complaints'
import { exportComplaintsCsv, exportComplaintsExcel } from '@/services/export'
import type { Complaint, DashboardStats } from '@/types'
import { CATEGORY_LABELS } from '@/constants'

export function AdminReportsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void Promise.all([getDashboardStats(), getComplaints()]).then(([s, c]) => {
      setStats(s)
      setComplaints(c)
      setLoading(false)
    })
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <PageTitle title={t('admin.reports')} />
      <div className="grid sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Resolved" value={stats.resolved} />
        <StatCard label="Closed" value={stats.closed} />
        <StatCard label="Avg Days" value={stats.avgResolutionDays} />
      </div>

      <Card className="mb-6 space-y-4">
        <h2 className="label-caps">Generate Report</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label>Format</Label>
            <Select defaultValue="xlsx">
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV</option>
            </Select>
          </div>
          <div>
            <Label>Scope</Label>
            <Select defaultValue="all">
              <option value="all">All complaints</option>
              <option value="open">Open only</option>
              <option value="resolved">Resolved / Closed</option>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => exportComplaintsExcel(complaints)}>
              <Download className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={() => exportComplaintsCsv(complaints)}>
              CSV
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="label-caps mb-4">Category Summary</h2>
        <ul className="space-y-2">
          {stats.byCategory.map((row) => (
            <li key={row.category} className="flex justify-between text-sm border-b border-vc-border/50 py-2">
              <span>{row.category}</span>
              <span className="font-semibold">{row.count}</span>
            </li>
          ))}
        </ul>
        {stats.mostReportedCategory ? (
          <p className="text-sm text-vc-muted mt-4">
            Most reported: <strong className="text-white">{CATEGORY_LABELS[stats.mostReportedCategory]}</strong>
          </p>
        ) : null}
      </Card>
    </div>
  )
}
