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
    <div className="px-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-display text-2xl font-bold text-emerald-950">{t('profile.title')}</h1>

      <div className="rounded-3xl bg-white border border-emerald-100 p-5 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <UserRound className="h-8 w-8" />
        </span>
        <div>
          <p className="font-display font-bold text-lg text-emerald-950">{citizen?.fullName}</p>
          <p className="text-emerald-700/70 text-sm">{citizen?.mobile}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-emerald-100 divide-y divide-emerald-50 overflow-hidden">
        <Row label={t('profile.name')} value={citizen?.fullName || '—'} />
        <Row label={t('profile.mobile')} value={citizen?.mobile || '—'} />
        <Row label={t('profile.village')} value={village.name} />
      </div>

      <div className="rounded-3xl bg-white border border-emerald-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Languages className="h-4 w-4 text-emerald-600" />
          <p className="font-semibold text-sm text-emerald-950">{t('profile.language')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => changeLang('en')}
            className={cn(
              'rounded-2xl border-2 py-3 text-sm font-semibold',
              language === 'en'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-emerald-100 text-emerald-800/70',
            )}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => changeLang('ta')}
            className={cn(
              'rounded-2xl border-2 py-3 text-sm font-semibold',
              language === 'ta'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-emerald-100 text-emerald-800/70',
            )}
          >
            🇮🇳 தமிழ்
          </button>
        </div>
      </div>

      <p className="text-xs text-emerald-700/60 px-1">{t('profile.futureNote')}</p>

      <button
        type="button"
        onClick={() => {
          logoutCitizen()
          navigate('/login')
        }}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold py-4"
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
      <span className="text-sm text-emerald-700/70">{label}</span>
      <span className="text-sm font-semibold text-emerald-950 text-right">{value}</span>
    </div>
  )
}
