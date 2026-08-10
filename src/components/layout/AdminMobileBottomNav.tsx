import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, List, Bell, Settings } from 'lucide-react'
import { cn } from '@/utils'

const tabs = [
  { to: '/admin', end: true, icon: LayoutDashboard, labelKey: 'admin.dashboard' },
  { to: '/admin/complaints', end: false, icon: List, labelKey: 'admin.complaints' },
  { to: '/admin/notifications', end: false, icon: Bell, labelKey: 'admin.notifications' },
  { to: '/admin/settings', end: false, icon: Settings, labelKey: 'admin.settings' },
]

/** Bottom tabs — mobile only. Desktop keeps the admin sidebar. */
export function AdminMobileBottomNav() {
  const { t } = useTranslation()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-vc-border bg-[#0a0e14]/95 backdrop-blur safe-bottom">
      <div className="grid grid-cols-4 px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, end, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition',
                isActive ? 'text-vc-accent' : 'text-vc-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl transition',
                    isActive ? 'bg-vc-accent/15 text-vc-accent' : '',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate max-w-[72px] text-center">{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
