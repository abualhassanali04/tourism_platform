import { useState } from 'react'
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { errorMessage } from '../utils/helpers'

export default function LoginPage() {
  const { t } = useI18n()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await login(email, password); navigate(from, { replace: true }) }
    catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <>
      <div><h2>{t('login.title')}</h2><p>{t('login.desc')}</p></div>
      <form className="form" onSubmit={submit}>
        <label><span className="req">{t('auth.email')}</span><input className="ltr" style={{ display: 'block', textAlign: 'start' }} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label><span className="req">{t('auth.password')}</span><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <div className="notice error" role="alert">{error}</div>}
        <button className="btn btn-lg btn-block" disabled={busy}><LogIn size={18} strokeWidth={1.75} />{busy ? t('auth.loggingIn') : t('auth.login')}</button>
      </form>
      <Link to="/register" className="btn btn-outline btn-lg btn-block"><UserPlus size={18} strokeWidth={1.75} />{t('auth.signup')}</Link>
    </>
  )
}
