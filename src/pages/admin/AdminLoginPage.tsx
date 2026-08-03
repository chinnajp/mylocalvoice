import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { TreePine } from 'lucide-react'
import { Button, Card, Input, Label, Spinner } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { DEMO_ADMIN, DEMO_STAFF_MEMBERS } from '@/data/mockData'
import { useMockData, useEmulator } from '@/lib/firebase'

interface LoginForm {
  email: string
  password: string
}

export function AdminLoginPage() {
  const { t } = useTranslation()
  const { login, admin } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: DEMO_ADMIN.email, password: DEMO_ADMIN.password },
  })

  useEffect(() => {
    if (admin) navigate('/admin', { replace: true })
  }, [admin, navigate])

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
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-slate-900">
            <TreePine className="h-6 w-6" />
          </span>
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

        <div className="mt-5 space-y-2 text-xs text-vc-muted">
          <p className="label-caps">
            {useMockData ? 'Demo accounts (mock)' : useEmulator ? 'Seeded accounts (emulator)' : 'Admin accounts'}
          </p>
          {!useMockData && useEmulator ? (
            <p className="text-[10px] opacity-80">
              Run <code className="text-sky-400">npm run seed:admin</code> once while emulators are
              running.
            </p>
          ) : null}
          <button
            type="button"
            className="w-full text-left rounded-xl border border-vc-border px-3 py-2 hover:border-sky-500/40"
            onClick={() => {
              setValue('email', DEMO_ADMIN.email)
              setValue('password', DEMO_ADMIN.password)
            }}
          >
            <span className="text-vc-accent font-semibold">President</span>
            <br />
            {DEMO_ADMIN.email} / {DEMO_ADMIN.password}
            <br />
            <span className="opacity-80">Assign Staff 1–5 · Close · Delete · all statuses</span>
          </button>
          <p className="text-[10px] pt-1 opacity-80">
            Staff can view all complaints; only assigned ones can be edited (password: staff123)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_STAFF_MEMBERS.map((s) => (
              <button
                key={s.email}
                type="button"
                className="w-full text-left rounded-xl border border-vc-border px-3 py-2 hover:border-sky-500/40"
                onClick={() => {
                  setValue('email', s.email)
                  setValue('password', s.password)
                }}
              >
                <span className="text-sky-400 font-semibold">{s.displayName}</span>
                <br />
                {s.email}
              </button>
            ))}
          </div>
        </div>

        <Link to="/" className="text-xs text-sky-400 mt-4 inline-block hover:underline">
          ← Back to public site
        </Link>
      </Card>
    </div>
  )
}
