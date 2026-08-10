import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { TreePine } from 'lucide-react'
import { Button, Card, Input, Label, Spinner } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { DEMO_ADMIN, DEMO_PRESIDENT, DEMO_STAFF_MEMBERS } from '@/data/mockData'
import { useMockData, useEmulator } from '@/lib/firebase'

interface LoginForm {
  email: string
  password: string
}

const STAFF_LOGINS = DEMO_STAFF_MEMBERS.slice(0, 4)
const ADMIN_UNLOCK_KEY = 'vc-admin-login-unlock'

export function AdminLoginPage() {
  const { t } = useTranslation()
  const { login, admin } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const logoTaps = useRef(0)
  const logoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showAdminLogins, setShowAdminLogins] = useState(() => {
    if (searchParams.get('admin') === '1') return true
    return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === '1'
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: {
      email: DEMO_PRESIDENT.email,
      password: DEMO_PRESIDENT.password,
    },
  })

  useEffect(() => {
    if (admin) navigate('/admin', { replace: true })
  }, [admin, navigate])

  useEffect(() => {
    if (searchParams.get('admin') === '1') {
      sessionStorage.setItem(ADMIN_UNLOCK_KEY, '1')
      setShowAdminLogins(true)
    }
  }, [searchParams])

  const fillAccount = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
    setError('')
  }

  /** Secret: tap logo 5× to reveal Admin quick-login (Admin only) */
  const onLogoTap = () => {
    logoTaps.current += 1
    if (logoTimer.current) clearTimeout(logoTimer.current)
    logoTimer.current = setTimeout(() => {
      logoTaps.current = 0
    }, 2000)
    if (logoTaps.current >= 5) {
      logoTaps.current = 0
      sessionStorage.setItem(ADMIN_UNLOCK_KEY, '1')
      setShowAdminLogins(true)
      fillAccount(DEMO_ADMIN.email, DEMO_ADMIN.password)
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setError('')
    try {
      await login(data.email, data.password)
      navigate('/admin')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md bg-vc-card border-vc-border">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={onLogoTap}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-slate-900"
            aria-label={t('brand')}
          >
            <TreePine className="h-6 w-6" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">{t('admin.login')}</h1>
            <p className="text-sm text-vc-muted">{t('admin.loginSub')}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" {...register('email', { required: true })} autoComplete="username" />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              {...register('password', { required: true })}
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="h-5 w-5" /> : null}
            Sign in
          </Button>
        </form>

        <div className="mt-6 space-y-4 text-xs text-vc-muted">
          <p className="label-caps">
            {useMockData ? 'Demo accounts (mock)' : useEmulator ? 'Seeded accounts (emulator)' : 'Quick login'}
          </p>
          {!useMockData && useEmulator ? (
            <p className="text-[10px] opacity-80">
              Run <code className="text-sky-400">npm run seed:admin</code> once while emulators are
              running.
            </p>
          ) : null}

          <div className="space-y-2">
            {showAdminLogins ? (
              <button
                type="button"
                className="w-full text-left rounded-xl border border-vc-border px-3 py-2.5 hover:border-vc-accent/50 transition"
                onClick={() => fillAccount(DEMO_ADMIN.email, DEMO_ADMIN.password)}
              >
                {DEMO_ADMIN.email} / {DEMO_ADMIN.password}
              </button>
            ) : null}

            <button
              type="button"
              className="w-full text-left rounded-xl border border-vc-border px-3 py-2.5 hover:border-amber-500/40 transition"
              onClick={() => fillAccount(DEMO_PRESIDENT.email, DEMO_PRESIDENT.password)}
            >
              {DEMO_PRESIDENT.email} / {DEMO_PRESIDENT.password}
            </button>

            <div className="grid grid-cols-2 gap-2">
              {STAFF_LOGINS.map((s) => (
                <button
                  key={s.email}
                  type="button"
                  className="w-full text-left rounded-xl border border-vc-border px-3 py-2.5 hover:border-sky-500/40 transition"
                  onClick={() => fillAccount(s.email, s.password)}
                >
                  <span className="break-all">
                    {s.email} / {s.password}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Link to="/" className="text-xs text-sky-400 mt-4 inline-block hover:underline">
          ← Back to public site
        </Link>
      </Card>
    </div>
  )
}
