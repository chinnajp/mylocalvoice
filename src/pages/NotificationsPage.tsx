import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'

export function NotificationsPage() {
  const { t } = useTranslation()

  return (
    <div className="px-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold text-emerald-950 mb-4">
        {t('notifications.title')}
      </h1>
      <div className="rounded-3xl bg-white border border-emerald-100 p-8 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
          <Bell className="h-7 w-7" />
        </span>
        <p className="font-semibold text-emerald-950 mb-2">{t('notifications.empty')}</p>
        <p className="text-sm text-emerald-800/70">{t('notifications.comingSoon')}</p>
      </div>
    </div>
  )
}
