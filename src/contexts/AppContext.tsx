import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import i18n from '@/i18n'
import { DEFAULT_VILLAGE } from '@/constants'
import type { AdminUser, CitizenUser, VillageConfig } from '@/types'
import { loginAdmin, logoutAdminSession } from '@/services/complaints'

export type AppLanguage = 'en' | 'ta'

interface AppContextValue {
  village: VillageConfig
  theme: 'dark' | 'light'
  toggleTheme: () => void
  language: AppLanguage
  languageChosen: boolean
  setLanguage: (lang: AppLanguage, markChosen?: boolean) => void
  resetLanguageChoice: () => void
  citizen: CitizenUser | null
  loginCitizen: (fullName: string, mobile: string) => void
  logoutCitizen: () => void
  admin: AdminUser | null
  loginAdminUser: (email: string, password: string) => Promise<void>
  logoutAdmin: () => void
  /** @deprecated use loginAdminUser */
  login: (email: string, password: string) => Promise<void>
  /** @deprecated use logoutAdmin — also clears citizen when used from admin layout */
  logout: () => void
  voterKey: string
}

const AppContext = createContext<AppContextValue | null>(null)

function readCitizen(): CitizenUser | null {
  try {
    const raw = localStorage.getItem('vc-citizen')
    return raw ? (JSON.parse(raw) as CitizenUser) : null
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('vc-theme') as 'dark' | 'light') || 'dark'
  })
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    return (localStorage.getItem('vc-lang') as AppLanguage) || 'en'
  })
  const [languageChosen, setLanguageChosen] = useState(
    () => localStorage.getItem('vc-lang-chosen') === '1',
  )
  const [citizen, setCitizen] = useState<CitizenUser | null>(() => readCitizen())
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem('vc-admin')
    return raw ? (JSON.parse(raw) as AdminUser) : null
  })
  const [voterKey] = useState(() => {
    let key = localStorage.getItem('vc-voter')
    if (!key) {
      key = `v_${Math.random().toString(36).slice(2)}`
      localStorage.setItem('vc-voter', key)
    }
    return key
  })

  useEffect(() => {
    localStorage.setItem('vc-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.body.classList.toggle('dark-theme', theme === 'dark')
  }, [theme])

  useEffect(() => {
    void i18n.changeLanguage(language)
    localStorage.setItem('vc-lang', language)
    document.documentElement.lang = language === 'ta' ? 'ta' : 'en'
    document.documentElement.classList.toggle('lang-ta', language === 'ta')
  }, [language])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const setLanguage = useCallback((lang: AppLanguage, markChosen = true) => {
    setLanguageState(lang)
    void i18n.changeLanguage(lang)
    localStorage.setItem('vc-lang', lang)
    if (markChosen) {
      setLanguageChosen(true)
      localStorage.setItem('vc-lang-chosen', '1')
    }
  }, [])

  const resetLanguageChoice = useCallback(() => {
    setLanguageChosen(false)
    localStorage.removeItem('vc-lang-chosen')
  }, [])

  const loginCitizen = useCallback((fullName: string, mobile: string) => {
    const user: CitizenUser = {
      fullName: fullName.trim(),
      mobile: mobile.replace(/\D/g, '').slice(-10),
      loggedInAt: new Date().toISOString(),
    }
    setCitizen(user)
    localStorage.setItem('vc-citizen', JSON.stringify(user))
  }, [])

  const logoutCitizen = useCallback(() => {
    setCitizen(null)
    localStorage.removeItem('vc-citizen')
  }, [])

  const loginAdminUser = useCallback(async (email: string, password: string) => {
    const user = await loginAdmin(email, password)
    setAdmin(user)
    localStorage.setItem('vc-admin', JSON.stringify(user))
  }, [])

  const logoutAdmin = useCallback(() => {
    setAdmin(null)
    localStorage.removeItem('vc-admin')
    void logoutAdminSession()
  }, [])

  const value = useMemo(
    () => ({
      village: DEFAULT_VILLAGE as VillageConfig,
      theme,
      toggleTheme,
      language,
      languageChosen,
      setLanguage,
      resetLanguageChoice,
      citizen,
      loginCitizen,
      logoutCitizen,
      admin,
      loginAdminUser,
      logoutAdmin,
      login: loginAdminUser,
      logout: logoutAdmin,
      voterKey,
    }),
    [
      theme,
      toggleTheme,
      language,
      languageChosen,
      setLanguage,
      resetLanguageChoice,
      citizen,
      loginCitizen,
      logoutCitizen,
      admin,
      loginAdminUser,
      logoutAdmin,
      voterKey,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
