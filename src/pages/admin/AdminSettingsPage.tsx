import { useTranslation } from 'react-i18next'
import { Card, PageTitle } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useMockData } from '@/lib/firebase'
import { roleLabel } from '@/utils/roles'

export function AdminSettingsPage() {
  const { t } = useTranslation()
  const { village, admin } = useApp()

  return (
    <div className="max-w-2xl">
      <PageTitle title={t('admin.settings')} />
      <Card className="space-y-4 mb-4">
        <h2 className="label-caps">Village Profile</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-vc-muted">Name</dt>
            <dd className="font-medium">{village.name}</dd>
          </div>
          <div>
            <dt className="text-vc-muted">Code</dt>
            <dd className="font-medium">{village.code}</dd>
          </div>
          <div>
            <dt className="text-vc-muted">District</dt>
            <dd className="font-medium">{village.district}</dd>
          </div>
          <div>
            <dt className="text-vc-muted">State</dt>
            <dd className="font-medium">{village.state}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-vc-muted">Multi-village ready</dt>
            <dd className="text-vc-muted text-xs mt-1">
              Each village stores its own logo, admins, and complaints under{' '}
              <code className="text-sky-400">villages/{'{villageId}'}</code> in Firestore.
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="space-y-3 mb-4">
        <h2 className="label-caps">Signed-in Admin</h2>
        <p className="text-sm">{admin?.displayName}</p>
        <p className="text-sm text-vc-muted">{admin?.email}</p>
        <p className="text-sm text-vc-muted">Role: {roleLabel(admin?.role)}</p>
        <div className="text-xs text-vc-muted border-t border-vc-border pt-3 space-y-1">
          <p>
            <strong className="text-white">President:</strong> Assign + Close + Delete + all statuses
          </p>
          <p>
            <strong className="text-white">Staff:</strong> Verified → In Progress → Resolved only
          </p>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="label-caps">Integrations</h2>
        <ul className="text-sm text-vc-muted space-y-2">
          <li>Data mode: {useMockData ? 'Mock (local demo)' : 'Firebase live'}</li>
          <li>Notifications: SMS / WhatsApp / Email / Push providers stubbed in services/notifications.ts</li>
          <li>Maps: set VITE_GOOGLE_MAPS_API_KEY for live Google Maps</li>
          <li>Copy .env.example → .env and fill Firebase credentials for production</li>
        </ul>
      </Card>
    </div>
  )
}
