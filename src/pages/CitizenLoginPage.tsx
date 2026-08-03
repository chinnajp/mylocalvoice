import { Navigate, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, TreePine } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

interface LoginForm {
  fullName: string
  mobile: string
}

export function CitizenLoginPage() {
  const { t } = useTranslation()
  const { languageChosen, citizen, loginCitizen, resetLanguageChoice } = useApp()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { fullName: '', mobile: '' },
  })

  if (!languageChosen) return <Navigate to="/welcome" replace />
  if (citizen) return <Navigate to="/" replace />

  const onSubmit = (data: LoginForm) => {
    loginCitizen(data.fullName, data.mobile)
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-emerald-50 flex flex-col">
      <div className="h-44 sm:h-52 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-900/55" />
        <button
          type="button"
          onClick={() => {
            resetLanguageChoice()
            navigate('/welcome')
          }}
          className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-2 text-sm text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('login.back')}
        </button>
        <div className="absolute bottom-5 left-0 right-0 px-5 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white mb-2">
            <TreePine className="h-6 w-6 text-emerald-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{t('login.title')}</h1>
          <p className="text-emerald-50 text-sm mt-1">{t('login.subtitle')}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 -mt-4 rounded-t-3xl bg-white px-5 pt-8 pb-10 max-w-lg mx-auto w-full shadow-[0_-8px_30px_rgba(6,78,59,0.08)]"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-emerald-950 mb-2">
              {t('login.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              {...register('fullName', {
                required: t('login.nameRequired'),
                minLength: { value: 2, message: t('login.nameRequired') },
              })}
              className="w-full rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 px-4 py-3.5 text-base text-emerald-950 placeholder:text-emerald-700/40 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              placeholder={t('login.fullNamePlaceholder')}
              autoComplete="name"
            />
            {errors.fullName ? (
              <p className="text-sm text-red-600 mt-1.5">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-semibold text-emerald-950 mb-2">
              {t('login.mobile')} <span className="text-red-500">*</span>
            </label>
            <input
              {...register('mobile', {
                required: t('login.mobileRequired'),
                validate: (v) => {
                  const digits = v.replace(/\D/g, '')
                  return digits.length === 10 || t('login.mobileInvalid')
                },
              })}
              inputMode="numeric"
              maxLength={14}
              className="w-full rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 px-4 py-3.5 text-base text-emerald-950 placeholder:text-emerald-700/40 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              placeholder={t('login.mobilePlaceholder')}
              autoComplete="tel"
            />
            {errors.mobile ? (
              <p className="text-sm text-red-600 mt-1.5">{errors.mobile.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg py-4 mt-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-60"
          >
            {t('login.continue')}
          </button>
        </div>

        <p className="text-center text-xs text-emerald-700/60 mt-8">
          <Link to="/admin/login" className="underline underline-offset-2">
            {t('nav.admin')}
          </Link>
        </p>
      </form>
    </div>
  )
}
