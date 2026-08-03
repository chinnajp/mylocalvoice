import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { Download } from 'lucide-react'
import { Button, Card, Label, PageTitle, Select, StatCard, Spinner } from '@/components/ui'
import { getComplaints, getDashboardStats } from '@/services/complaints'
import { exportComplaintsCsv, exportComplaintsExcel } from '@/services/export'
import type { Complaint, DashboardStats } from '@/types'

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#eab308', '#22c55e', '#64748b']

export function AdminStatisticsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [range, setRange] = useState('7')
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
      <PageTitle title={t('admin.statistics')} />

      {/* Filter bar — matches screenshot layout */}
      <Card className="mb-4 sm:mb-6 p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div>
            <Label>Date Range</Label>
            <Select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </Select>
          </div>
          <div>
            <Label>Group By</Label>
            <Select defaultValue="category">
              <option value="category">Category</option>
              <option value="status">Status</option>
              <option value="area">Area</option>
            </Select>
          </div>
          <Button type="button" className="w-full sm:w-auto">Submit</Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => exportComplaintsCsv(complaints)}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </div>
      </Card>

      <Card className="mb-4 sm:mb-6 p-4 sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <StatCard label="Total Complaints" value={stats.total} className="p-3" />
          <StatCard label="Pending" value={stats.pending} className="p-3" />
          <StatCard label="In Progress" value={stats.inProgress} className="p-3" />
          <StatCard label="Resolved" value={stats.resolved} className="p-3" />
          <StatCard label="Avg Resolution (days)" value={stats.avgResolutionDays} className="p-3 col-span-2 md:col-span-1" />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <Card className="p-4 sm:p-5 overflow-hidden">
          <h2 className="label-caps mb-4">Status Distribution</h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {stats.byStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#151b24', border: '1px solid #243044', borderRadius: 12 }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 overflow-hidden">
          <h2 className="label-caps mb-4">Category Breakdown</h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCategory} margin={{ bottom: 40, left: 0, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis dataKey="category" tick={{ fill: '#8b9cb3', fontSize: 8 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} width={28} tick={{ fill: '#8b9cb3', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#151b24', border: '1px solid #243044', borderRadius: 12 }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => exportComplaintsExcel(complaints)}>
          Export Excel
        </Button>
      </div>
    </div>
  )
}
