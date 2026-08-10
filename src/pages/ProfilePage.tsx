import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Languages, LogOut, UserRound } from 'lucide-react'
import { useApp, type AppLanguage } from '@/contexts/AppContext'
import { cn } from '@/utils'

export function ProfilePage() {
  const { t } = useTranslation()
  const { citizen, village, language, setLanguage, logoutCitizen } = useApp()
  const navigate = useNavigate()

  const changeLang = (lang: AppLanguage) => setLanguage(lang, true)

  return (
    <div className="px-4 max-w-lg mx-auto py-6 md:py-10 space-y-4">
      <h1 className="font-display text-2xl font-bold dark:text-white text-light-text">
        {t('profile.title')}
      </h1>

      <div className="rounded-3xl dark:bg-vc-card bg-white border dark:border-vc-border border-light-border p-5 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-vc-accent/15 text-vc-accent">
          <UserRound className="h-8 w-8" />
        </span>
        <div>
          <p className="font-display font-bold text-lg dark:text-white text-light-text">
            {citizen?.fullName}
          </p>
          <p className="text-vc-muted text-sm">{citizen?.mobile}</p>
        </div>
      </div>

      <div className="rounded-3xl dark:bg-vc-card bg-white border dark:border-vc-border border-light-border divide-y dark:divide-vc-border divide-light-border overflow-hidden">
        <Row label={t('profile.name')} value={citizen?.fullName || '—'} />
        <Row label={t('profile.mobile')} value={citizen?.mobile ? `+91 ${citizen.mobile}` : '—'} />
        <Row
          label={t('profile.village')}
          value={citizen?.areaName || village.panchayat || village.name}
        />
        <Row label={t('profile.area')} value={citizen?.areaName || '—'} />
      </div>

      <div className="rounded-3xl dark:bg-vc-card bg-white border dark:border-vc-border border-light-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Languages className="h-4 w-4 text-vc-teal" />
          <p className="font-semibold text-sm dark:text-white text-light-text">{t('profile.language')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => changeLang('en')}
            className={cn(
              'rounded-2xl border-2 py-3 text-sm font-semibold',
              language === 'en'
                ? 'border-vc-accent bg-vc-accent/10 text-vc-accent'
                : 'dark:border-vc-border border-light-border text-vc-muted',
            )}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => changeLang('ta')}
            className={cn(
              'rounded-2xl border-2 py-3 text-sm font-semibold',
              language === 'ta'
                ? 'border-vc-accent bg-vc-accent/10 text-vc-accent'
                : 'dark:border-vc-border border-light-border text-vc-muted',
            )}
          >
            தமிழ்
          </button>
        </div>
      </div>

      <p className="text-xs text-vc-muted px-1">{t('profile.futureNote')}</p>

      <button
        type="button"
        onClick={() => {
          logoutCitizen()
          navigate('/login')
        }}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-vc-accent text-slate-900 font-semibold py-4 shadow-md shadow-amber-500/30"
      >
        <LogOut className="h-5 w-5" />
        {t('profile.logout')}
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="text-sm text-vc-muted">{label}</span>
      <span className="text-sm font-semibold dark:text-white text-light-text text-right">{value}</span>
    </div>
  )
}
