import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { Segmented } from '../components/ui'
import { errorMessage } from '../utils/helpers'

export default function RegisterPage() {
  const { t, isRtl } = useI18n()
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Tourist', gender: 'Male', country: '', preferredLanguage: isRtl ? 'Arabic' : 'English', bio: '', pricePerDay: 60, languages: 'English, Arabic' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (isAuthenticated) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const payload = { fullName: form.fullName, email: form.email, password: form.password, role: form.role, gender: form.gender, country: form.country, preferredLanguage: form.preferredLanguage }
    if (form.role === 'Guide') {
      payload.bio = form.bio
      payload.pricePerDay = Number(form.pricePerDay)
      payload.languages = form.languages.split(',').map((l) => l.trim()).filter(Boolean)
    }
    try { await register(payload); navigate('/') }
    catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <>
      <div><h2>{t('register.title')}</h2><p>{t('register.desc')}</p></div>
      <Segmented label={t('auth.accountType')} value={form.role} onChange={(role) => setForm({ ...form, role })} options={[{ value: 'Tourist', label: t('role.Tourist') }, { value: 'Guide', label: t('role.Guide') }]} />
      <form className="form" onSubmit={submit}>
        <label><span className="req">{t('auth.fullName')}</span><input value={form.fullName} onChange={set('fullName')} required maxLength={120} autoComplete="name" /></label>
        <div className="form-grid">
          <label><span className="req">{t('auth.email')}</span><input type="email" value={form.email} onChange={set('email')} required autoComplete="email" /></label>
          <label><span className="req">{t('auth.passwordLength')}</span><input type="password" value={form.password} onChange={set('password')} required minLength={8} autoComplete="new-password" /></label>
        </div>
        <div className="form-grid">
          <label>{t('auth.gender')}<select value={form.gender} onChange={set('gender')}><option value="Male">{t('auth.male')}</option><option value="Female">{t('auth.female')}</option></select></label>
          <label><span className="req">{t('auth.country')}</span><input value={form.country} onChange={set('country')} required maxLength={80} autoComplete="country-name" /></label>
        </div>
        <label>{t('auth.preferredLanguage')}<select value={form.preferredLanguage} onChange={set('preferredLanguage')}>
          {['English', 'Arabic', 'Persian', 'German', 'French'].map((language) => <option key={language} value={language}>{t(`language.${language.toLowerCase()}`)}</option>)}
        </select></label>
        {form.role === 'Guide' && (
          <>
            <label>{t('auth.bio')}<textarea rows={3} value={form.bio} onChange={set('bio')} maxLength={2000} /></label>
            <div className="form-grid">
              <label>{t('auth.pricePerDay')}<input type="number" min={0} max={10000} value={form.pricePerDay} onChange={set('pricePerDay')} /></label>
              <label>{t('auth.languagesComma')}<input value={form.languages} onChange={set('languages')} /></label>
            </div>
          </>
        )}
        {error && <div className="notice error" role="alert">{error}</div>}
        <button className="btn btn-lg btn-block" disabled={busy}><UserPlus size={18} strokeWidth={1.75} />{busy ? t('auth.creatingAccount') : t('auth.signup')}</button>
      </form>
      <p className="muted" style={{ margin: 0 }}>{t('auth.alreadyRegistered')} <Link to="/login">{t('auth.login')}</Link></p>
    </>
  )
}
