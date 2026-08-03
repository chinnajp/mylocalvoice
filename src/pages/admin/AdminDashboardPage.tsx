import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import { PageTitle, StatCard, Card, Spinner, Badge } from '@/components/ui'
import { getComplaints, getDashboardStats } from '@/services/complaints'
import type { Complaint, DashboardStats } from '@/types'
import { CATEGORY_LABELS } from '@/constants'
import { formatDate, getStatusBadgeClass, statusLabel } from '@/utils'

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void Promise.all([getDashboardStats(), getComplaints()]).then(([s, c]) => {
      setStats(s)
      setRecent(c.slice(0, 6))
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
      <PageTitle title={t('admin.dashboard')} />

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <StatCard label="Total" value={stats.total} className="p-3 sm:px-4 sm:py-4" />
        <StatCard label="Today" value={stats.today} className="p-3 sm:px-4 sm:py-4" />
        <StatCard label="Pending" value={stats.pending} className="p-3 sm:px-4 sm:py-4" />
        <StatCard label="In Progress" value={stats.inProgress} className="p-3 sm:px-4 sm:py-4" />
        <StatCard label="Resolved" value={stats.resolved} className="p-3 sm:px-4 sm:py-4" />
        <StatCard label="Closed" value={stats.closed} className="p-3 sm:px-4 sm:py-4" />
        <StatCard label="Avg Days" value={stats.avgResolutionDays} className="p-3 sm:px-4 sm:py-4" />
        <StatCard
          label="Top Category"
          value={stats.mostReportedCategory ? CATEGORY_LABELS[stats.mostReportedCategory].split(' ')[0] : '—'}
          className="p-3 sm:px-4 sm:py-4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="p-4 sm:p-5 md:p-6 overflow-hidden">
          <h2 className="label-caps mb-4">Complaint Trends (7 days)</h2>
          <div className="h-48 sm:h-56 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis dataKey="date" tick={{ fill: '#8b9cb3', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis allowDecimals={false} width={28} tick={{ fill: '#8b9cb3', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#151b24', border: '1px solid #243044', borderRadius: 12 }}
                />
                <Area type="monotone" dataKey="count" stroke="#2dd4bf" fill="url(#trendFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 md:p-6 overflow-hidden">
          <h2 className="label-caps mb-4">By Category</h2>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCategory} layout="vertical" margin={{ left: 4, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#8b9cb3', fontSize: 10 }} />
                <YAxis type="category" dataKey="category" width={72} tick={{ fill: '#8b9cb3', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: '#151b24', border: '1px solid #243044', borderRadius: 12 }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {stats.byCategory.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? '#38bdf8' : '#2dd4bf'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-caps">Recent Complaints</h2>
          <Link to="/admin/complaints" className="text-sm text-sky-400 hover:underline">
            View all
          </Link>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {recent.map((c) => (
            <Link
              key={c.id}
              to={`/admin/complaints/${c.complaintId}`}
              className="block rounded-xl border border-vc-border bg-[#121820] p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sky-400 font-medium text-sm">{c.complaintId}</span>
                <Badge className={getStatusBadgeClass(c.status)}>{statusLabel(c.status)}</Badge>
              </div>
              <p className="text-xs text-vc-muted">{CATEGORY_LABELS[c.category]} · {formatDate(c.createdAt)}</p>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left label-caps border-b border-vc-border">
                <th className="pb-3 pr-3">ID</th>
                <th className="pb-3 pr-3">Category</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3 pr-3">Supporters</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((c) => (
                <tr key={c.id} className="border-b border-vc-border/60 hover:bg-white/[0.02]">
                  <td className="py-3 pr-3">
                    <Link to={`/admin/complaints/${c.complaintId}`} className="text-sky-400 hover:underline">
                      {c.complaintId}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-vc-muted">{CATEGORY_LABELS[c.category]}</td>
                  <td className="py-3 pr-3">
                    <Badge className={getStatusBadgeClass(c.status)}>{statusLabel(c.status)}</Badge>
                  </td>
                  <td className="py-3 pr-3">{c.supporters}</td>
                  <td className="py-3 text-vc-muted">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
