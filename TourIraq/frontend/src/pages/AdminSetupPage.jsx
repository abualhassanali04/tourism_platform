import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { ErrorBox, Loading, PageHeading } from '../components/ui'
import { errorMessage } from '../utils/helpers'

export default function AdminSetupPage() {
    const { t } = useI18n()
    const { login } = useAuth()
    const navigate = useNavigate()
    const status = useFetch(async () => (await api.get('/admin-setup/status')).data)
    const [setupToken, setSetupToken] = useState('')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const submit = async (event) => {
        event.preventDefault()
        setBusy(true)
        setError('')
        try {
            await api.post('/admin-setup', { setupToken, fullName, email, password })
            await login(email, password)
            navigate('/admin/places/new', { replace: true })
        } catch (requestError) {
            setError(errorMessage(requestError))
        } finally {
            setBusy(false)
        }
    }

    if (status.loading) return <Loading />
    if (status.error) return <ErrorBox message={status.error} onRetry={status.reload} />

    return (
        <>
            <PageHeading eyebrow={t('admin.setupAction')} title={t('admin.setupTitle')} description={t('admin.setupDescription')} />
            {!status.data?.available ? (
                <div className="notice info">{t('admin.setupClosed')}</div>
            ) : (
                <div className="card card-pad" style={{ maxWidth: 560 }}>
                    <form className="form" onSubmit={submit}>
                        <label>
                            <span className="req">{t('admin.setupToken')}</span>
                            <input type="password" value={setupToken} onChange={(event) => setSetupToken(event.target.value)} autoComplete="off" required />
                            <span className="small muted">{t('admin.setupTokenHelp')}</span>
                        </label>
                        <label><span className="req">{t('auth.fullName')}</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" maxLength={120} required /></label>
                        <label><span className="req">{t('auth.email')}</span><input className="ltr" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={256} required /></label>
                        <label><span className="req">{t('auth.passwordLength')}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={100} required /></label>
                        {error && <div className="notice error" role="alert">{error}</div>}
                        <button className="btn" disabled={busy}><ShieldCheck size={17} />{busy ? t('admin.settingUp') : t('admin.createAdmin')}</button>
                        <Link className="small" to="/">{t('nav.home')}</Link>
                    </form>
                </div>
            )}
        </>
    )
}