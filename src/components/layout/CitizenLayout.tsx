import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, FilePlus2, Search, Bell, UserRound, Languages, TreePine } from 'lucide-react'
import { useApp, type AppLanguage } from '@/contexts/AppContext'
import { cn } from '@/utils'

const tabs = [
  { to: '/home', end: true, icon: Home, labelKey: 'nav.home' },
  { to: '/report', end: false, icon: FilePlus2, labelKey: 'nav.report' },
  { to: '/track', end: false, icon: Search, labelKey: 'nav.track' },
  { to: '/notifications', end: false, icon: Bell, labelKey: 'nav.notifications' },
  { to: '/profile', end: false, icon: UserRound, labelKey: 'nav.profile' },
]

export function CitizenLayout() {
  const { t } = useTranslation()
  const { citizen, languageChosen, language, setLanguage } = useApp()
  const navigate = useNavigate()

  if (!languageChosen) return <Navigate to="/" replace />
  if (!citizen) return <Navigate to="/login" replace />

  const toggleLang = () => {
    const next: AppLanguage = language === 'en' ? 'ta' : 'en'
    setLanguage(next, true)
  }

  return (
    <div className="min-h-dvh bg-emerald-50 text-emerald-950 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-emerald-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => navigate('/home')}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <TreePine className="h-5 w-5" />
            </span>
            <span className="font-display font-bold text-emerald-950 text-sm">{t('brand')}</span>
          </button>
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
            aria-label={t('profile.changeLanguage')}
          >
            <Languages className="h-3.5 w-3.5" />
            {language === 'en' ? 'EN' : 'தமிழ்'}
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-emerald-100 bg-white/95 backdrop-blur safe-bottom">
        <div className="max-w-lg mx-auto grid grid-cols-5 px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map(({ to, end, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition',
                  isActive ? 'text-emerald-700' : 'text-emerald-800/45',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl transition',
                      isActive ? 'bg-emerald-100 text-emerald-700' : '',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="truncate max-w-[64px] text-center">{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
