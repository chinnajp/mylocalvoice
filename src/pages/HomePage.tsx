import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight, Megaphone, Star } from 'lucide-react'
import { Button, Card, StatCard, Spinner } from '@/components/ui'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import { VillageMap } from '@/components/map/VillageMap'
import { getAnnouncements, getComplaints, getDashboardStats } from '@/services/complaints'
import type { Announcement, Complaint, DashboardStats } from '@/types'
import { useApp } from '@/contexts/AppContext'
import { mockTestimonials } from '@/data/mockData'
import { formatDate } from '@/utils'

export function HomePage() {
  const { t, i18n } = useTranslation()
  const { village } = useApp()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void Promise.all([getDashboardStats(), getComplaints(), getAnnouncements()]).then(
      ([s, c, a]) => {
        setStats(s)
        setComplaints(c.slice(0, 4))
        setAnnouncements(a)
        setLoading(false)
      },
    )
  }, [])

  const ta = i18n.language === 'ta'

  return (
    <div>
      {/* Hero — centered, full-bleed */}
      <section className="relative min-h-[calc(100dvh-8.5rem)] md:min-h-[calc(100dvh-4rem)] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80"
          alt={`${village.name} village`}
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-[#0d1117]/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117]/40 via-transparent to-[#0d1117]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(45,212,191,0.22) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-5 pt-10 pb-16 sm:pb-20 text-center -translate-y-6 sm:-translate-y-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-4 py-1.5 mb-5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-vc-teal animate-pulse" />
            <span className="font-display text-vc-teal text-xs sm:text-sm font-semibold tracking-wide">
              {village.name} · {t('brand')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className="font-display text-[2.1rem] sm:text-5xl md:text-6xl lg:text-[3.75rem] font-extrabold text-white leading-[1.2] tracking-tight mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
          >
            {t('home.heroTitle')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-slate-200/95 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-8"
          >
            {t('home.heroSub')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <Link to="/report">
              <Button size="lg" className="min-w-[160px] shadow-lg shadow-teal-500/25 text-base px-7 py-3.5">
                {t('home.reportCta')}
              </Button>
            </Link>
            <Link to="/track">
              <Button
                size="lg"
                variant="outline"
                className="min-w-[160px] bg-black/25 backdrop-blur-sm text-base px-7 py-3.5"
              >
                {t('home.trackCta')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20 space-y-16 pb-20">
        {/* Stats */}
        <section>
          {loading || !stats ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard label={t('home.statsTotal')} value={stats.total} />
              <StatCard label={t('home.statsPending')} value={stats.pending} />
              <StatCard label={t('home.statsProgress')} value={stats.inProgress} />
              <StatCard label={t('home.statsResolved')} value={stats.resolved + stats.closed} />
            </div>
          )}
        </section>

        {/* Announcements */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Megaphone className="h-5 w-5 text-vc-accent" />
            <h2 className="font-display text-2xl font-bold dark:text-white text-light-text">
              {t('home.latestAnnouncements')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {announcements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={a.priority === 'high' ? 'border-vc-accent/40' : ''}>
                  {a.priority === 'high' ? (
                    <span className="label-caps text-vc-accent mb-2 block">Priority</span>
                  ) : null}
                  <h3 className="font-semibold dark:text-white text-light-text mb-2">
                    {ta && a.titleTa ? a.titleTa : a.title}
                  </h3>
                  <p className="text-sm text-vc-muted mb-3">{ta && a.bodyTa ? a.bodyTa : a.body}</p>
                  <p className="text-xs text-vc-muted">{formatDate(a.createdAt)}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent complaints */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold dark:text-white text-light-text">
              {t('home.recentComplaints')}
            </h2>
            <Link to="/complaints" className="text-sm text-sky-400 inline-flex items-center gap-1 hover:underline">
              {t('home.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {complaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        </section>

        {/* Map */}
        <section>
          <h2 className="font-display text-2xl font-bold dark:text-white text-light-text mb-5">
            {t('home.mapTitle')}
          </h2>
          <VillageMap complaints={complaints} height="400px" />
        </section>

        {/* Testimonials */}
        <section>
          <h2 className="font-display text-2xl font-bold dark:text-white text-light-text mb-5">
            {t('home.testimonials')}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {mockTestimonials.map((tm) => (
              <Card key={tm.id}>
                <div className="flex gap-0.5 mb-3 text-vc-accent">
                  {Array.from({ length: tm.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm dark:text-slate-200 text-slate-700 mb-4">
                  “{ta && tm.quoteTa ? tm.quoteTa : tm.quote}”
                </p>
                <p className="font-semibold text-sm dark:text-white text-light-text">{tm.name}</p>
                <p className="text-xs text-vc-muted">{tm.area}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
