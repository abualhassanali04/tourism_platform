import { Languages, ShieldCheck } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { Logo } from '../components/ui'

// Full-window split layout for login / register.
export default function AuthLayout({ children, wide }) {
  const { t, toggleLang } = useI18n()
  return (
    <div className="auth">
      <section className="auth-art">
        <Logo t={t} />
        <div>
          <h1>{t('login.headline')}</h1>
          <p>{t('login.art')}</p>
        </div>
        <small><bdi>© {t('brand')}</bdi></small>
      </section>
      <section className="auth-side">
        <div className={`auth-card ${wide ? 'wide' : ''}`}>
          <div><button className="btn btn-ghost btn-sm" onClick={toggleLang}><Languages size={16} strokeWidth={1.75} />{t('top.lang')}</button></div>
          {children}
          <p className="note"><ShieldCheck size={16} strokeWidth={1.75} />{t('security.note')}</p>
        </div>
      </section>
    </div>
  )
}
