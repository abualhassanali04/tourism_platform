import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserCheck } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useI18n } from '../i18n/I18nContext'
import { Avatar, Empty, ErrorBox, Loading, PageHeading } from '../components/ui'
import { formatPrice } from '../utils/helpers'

const LANGUAGES = ['', 'English', 'Arabic', 'Persian', 'German', 'French']

// eslint-disable-next-line react-refresh/only-export-components
export function Stars({ value }) {
  const { t } = useI18n()
  const full = Math.round(value)
  return <span className="stars" aria-label={t('guide.stars', { value })}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
}

export default function GuidesPage() {
  const { t, isRtl } = useI18n()
  const [language, setLanguage] = useState('')
  const [governorateId, setGovernorateId] = useState('')
  const govs = useFetch(async () => (await api.get('/governorates')).data)
  const guides = useFetch(
    async () => (await api.get('/guides', { params: { language: language || undefined, governorateId: governorateId || undefined, pageSize: 50 } })).data,
    [language, governorateId],
  )

  return (
    <>
      <PageHeading eyebrow={t('guides.eyebrow')} title={t('guides.title')} description={t('guides.desc')} />

      <div className="card card-pad form-grid" style={{ maxWidth: 560 }}>
        <label>{t('guides.language')}
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>{LANGUAGES.map((l) => <option key={l} value={l}>{l ? t(`language.${l.toLowerCase()}`) : t('guides.anyLanguage')}</option>)}</select>
        </label>
        <label>{t('guides.destination')}
          <select value={governorateId} onChange={(e) => setGovernorateId(e.target.value)}>
            <option value="">{t('guides.anyGovernorate')}</option>{govs.data?.map((g) => <option key={g.id} value={g.id}>{isRtl ? g.nameAr : g.name}</option>)}
          </select>
        </label>
      </div>

      {guides.loading && <Loading />}
      {guides.error && <ErrorBox message={guides.error} onRetry={guides.reload} />}
      {guides.data?.items.length === 0 && <div className="card"><Empty icon={UserCheck} title={t('guides.noMatch')}>{t('guides.changeFilters')}</Empty></div>}
      <div className="grid">
        {guides.data?.items.map((g) => (
          <Link key={g.userId} to={`/guides/${g.userId}`} className="card card-pad">
            <div className="person" style={{ marginBottom: 10 }}>
              <Avatar name={g.fullName} size="lg" />
              <div><b>{g.fullName}</b><span><Stars value={g.avgRating} /> {g.reviewsCount ? <span className="num">{g.avgRating.toFixed(1)} ({g.reviewsCount})</span> : t('guides.noReviews')}</span></div>
            </div>
            <p className="small">{g.bio}</p>
            <p>{g.languages.map((l) => <span key={l} className="pill pill-green">{l}</span>)}</p>
            <b style={{ color: 'var(--primary)' }}><span className="num">{formatPrice(g.pricePerDay)}</span> {t('guides.perDay')}</b>
          </Link>
        ))}
      </div>
    </>
  )
}
