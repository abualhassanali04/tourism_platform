import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { dict } from './translations'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('touriraq_lang') || 'en')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('touriraq_lang', lang)
  }, [lang])

  const t = useCallback(
    (key, vars) => {
      let s = dict[lang][key] ?? dict.en[key] ?? key
      if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v) })
      return s
    },
    [lang],
  )

  const value = useMemo(
    () => ({ lang, t, isRtl: lang === 'ar', toggleLang: () => setLang((l) => (l === 'en' ? 'ar' : 'en')) }),
    [lang, t],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
