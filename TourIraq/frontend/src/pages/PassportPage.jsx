import { Link } from 'react-router-dom'
import { Gift, Stamp } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useI18n } from '../i18n/I18nContext'
import { Donut, Empty, ErrorBox, Loading, PageHeading } from '../components/ui'
import { formatDate, imageUrl } from '../utils/helpers'

export default function PassportPage() {
  const { t, isRtl } = useI18n()
  const passport = useFetch(async () => (await api.get('/passport/me')).data)
  const rewards = useFetch(async () => (await api.get('/rewards')).data)

  const total = passport.data?.totalStamps ?? 0
  const next = rewards.data?.find((r) => !r.isUnlocked)
  const byGov = Object.entries((passport.data?.stamps ?? []).reduce((a, s) => ({ ...a, [s.governorateName]: (a[s.governorateName] || 0) + 1 }), {})).map(([label, value]) => ({
    label: isRtl && ['Baghdad', 'Najaf', 'Karbala', 'Babylon'].includes(label) ? t(`gov.name.${label.toLowerCase()}`) : label,
    value,
  }))

  return (
    <>
      <PageHeading eyebrow={t('passport.eyebrow')} title={t('passport.title')} description={t('passport.desc')} action={<Link to="/" className="btn"><Stamp size={16} strokeWidth={1.75} />{t('passport.collectMore')}</Link>} />
      {passport.loading && <Loading />}
      {passport.error && <ErrorBox message={passport.error} onRetry={passport.reload} />}

      {passport.data && (
        <div className="split">
          <div className="dark-card">
            <span className="label">{t('passport.stampsCollected')}</span>
            <div className="big-num num">{total}</div>
            {next ? (
              <>
                <p style={{ color: 'rgba(255,255,255,.8)', margin: '6px 0 10px' }}>{t('passport.moreToUnlock', { count: Math.max(0, next.requiredStamps - total), reward: next.title, partner: next.partnerName })}</p>
                <div className="progress"><span style={{ width: `${Math.min(100, (total / next.requiredStamps) * 100)}%` }} /></div>
              </>
            ) : <p style={{ color: 'rgba(255,255,255,.8)' }}>{t('passport.allUnlocked')}</p>}
          </div>
          <div className="card card-pad">
            <div className="card-title"><h3 style={{ margin: 0 }}>{t('passport.byGovernorate')}</h3></div>
            <Donut segments={byGov.length ? byGov : [{ label: '—', value: 0 }]} centerLabel={t('passport.stampsLabel')} />
          </div>
        </div>
      )}

      {passport.data && (passport.data.stamps.length === 0 ? (
        <div className="card"><Empty icon={Stamp} title={t('passport.noStamps')}>{t('passport.firstStamp')}</Empty></div>
      ) : (
        <div className="stamp-grid">
          {passport.data.stamps.map((s) => (
            <Link key={s.stampId} to={`/places/${s.placeId}`} className="stamp">
              <img src={imageUrl(s.photoUrl)} alt={t('passport.stampPhoto', { place: isRtl ? s.placeNameAr || s.placeName : s.placeName })} loading="lazy" />
              <b>{isRtl ? s.placeNameAr || s.placeName : s.placeName}</b>
              <span className="small muted">{isRtl && ['Baghdad', 'Najaf', 'Karbala', 'Babylon'].includes(s.governorateName) ? t(`gov.name.${s.governorateName.toLowerCase()}`) : s.governorateName} · {formatDate(s.createdAt)}</span>
            </Link>
          ))}
        </div>
      ))}

      <section>
        <h2><Gift size={18} strokeWidth={1.75} style={{ verticalAlign: -3 }} /> {t('passport.rewards')}</h2>
        {rewards.loading && <Loading />}
        {rewards.error && <ErrorBox message={rewards.error} onRetry={rewards.reload} />}
        {rewards.data?.length === 0 && <div className="card"><Empty icon={Gift} title={t('passport.noRewards')} /></div>}
        <div className="grid">
          {rewards.data?.map((r) => (
            <div key={r.id} className={`card reward ${r.isUnlocked ? '' : 'locked'}`}>
              <div className="pct"><span className="num">{r.discountPercent}%</span></div>
              <div style={{ flex: 1 }}>
                <b style={{ color: 'var(--primary)' }}>{r.title}</b>
                <div className="small muted">{r.partnerName} · {r.partnerType}</div>
                <div className="progress" style={{ marginBlock: 6 }}><span style={{ width: `${Math.min(100, (total / r.requiredStamps) * 100)}%` }} /></div>
                <span className={`badge ${r.isUnlocked ? 'badge-success' : 'badge-warning'}`}>{r.isUnlocked ? t('passport.unlocked') : t('passport.stampsNeeded', { count: r.requiredStamps })}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
