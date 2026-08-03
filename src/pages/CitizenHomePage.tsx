import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  FilePlus2,
  FolderOpen,
  Search,
  Bell,
  UserRound,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { cn } from '@/utils'

const actions = [
  {
    to: '/report',
    key: 'report',
    icon: FilePlus2,
    color: 'bg-emerald-600 text-white',
    tile: 'bg-emerald-600 text-white shadow-emerald-600/30',
  },
  {
    to: '/my-reports',
    key: 'myReports',
    icon: FolderOpen,
    color: 'bg-teal-100 text-teal-800',
    tile: 'bg-white text-emerald-950 border border-emerald-100',
  },
  {
    to: '/track',
    key: 'track',
    icon: Search,
    color: 'bg-sky-100 text-sky-800',
    tile: 'bg-white text-emerald-950 border border-emerald-100',
  },
  {
    to: '/notifications',
    key: 'notifications',
    icon: Bell,
    color: 'bg-amber-100 text-amber-800',
    tile: 'bg-white text-emerald-950 border border-emerald-100',
  },
  {
    to: '/profile',
    key: 'profile',
    icon: UserRound,
    color: 'bg-violet-100 text-violet-800',
    tile: 'bg-white text-emerald-950 border border-emerald-100',
  },
] as const

export function CitizenHomePage() {
  const { t } = useTranslation()
  const { citizen, village } = useApp()
  const firstName = citizen?.fullName?.split(' ')[0] || ''

  return (
    <div className="px-4 pt-2 pb-6 max-w-lg mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 mb-6 shadow-lg shadow-emerald-700/20"
      >
        <p className="text-emerald-100 text-sm mb-1">{village.name}</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
          {t('dash.greeting')} {firstName}!
        </h1>
        <p className="text-emerald-50/90 text-sm mt-2">{t('dash.subtitle')}</p>
      </motion.section>

      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70 mb-3 px-1">
        {t('dash.quickActions')}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {actions.map((action, i) => {
          const Icon = action.icon
          const primary = i === 0
          return (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={cn(primary && 'col-span-2')}
            >
              <Link
                to={action.to}
                className={cn(
                  'flex items-center gap-3 rounded-2xl p-4 min-h-[88px] shadow-sm active:scale-[0.98] transition',
                  action.tile,
                  primary && 'shadow-lg',
                )}
              >
                <span
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                    primary ? 'bg-white/20' : action.color,
                  )}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <span className="flex-1">
                  <span className={cn('block font-semibold text-base', primary ? 'text-lg' : '')}>
                    {t(`dash.${action.key}`)}
                  </span>
                </span>
                <ChevronRight className={cn('h-5 w-5 opacity-60', primary && 'opacity-80')} />
              </Link>
            </motion.div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white p-4 flex gap-3 items-start">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="text-sm text-emerald-800/80 leading-relaxed">{t('dash.tip')}</p>
      </div>
    </div>
  )
}
