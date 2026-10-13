import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Landmark } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useI18n } from '../i18n/I18nContext'
import { Empty, ErrorBox, Loading, PageHeading } from '../components/ui'
import PlaceCard from '../components/PlaceCard'
import MapView from '../components/MapView'

const CATEGORIES = ['All', 'Archaeological', 'Religious', 'Heritage', 'Nature', 'Other']

export default function GovernoratePage() {
  const { id } = useParams()
  const { t, isRtl } = useI18n()
  const [category, setCategory] = useState('All')
  const gov = useFetch(async () => (await api.get('/governorates')).data.find((g) => String(g.id) === id), [id])
  const places = useFetch(
    async () => (await api.get(`/governorates/${id}/places`, { params: { category: category === 'All' ? undefined : category, pageSize: 50 } })).data,
    [id, category],
  )

  return (
    <>
      <Link to="/" className="small" style={{ fontWeight: 700 }}><ArrowLeft size={14} className="flip-rtl" style={{ verticalAlign: -2 }} /> {t('nav.home')}</Link>
      {gov.data && <PageHeading eyebrow={t('crumb.governorates')} title={<>{isRtl ? gov.data.nameAr : gov.data.name} <span className="muted" lang={isRtl ? 'en' : 'ar'}>{isRtl ? gov.data.name : gov.data.nameAr}</span></>} description={isRtl ? gov.data.descriptionAr || gov.data.description : gov.data.description} />}

      <div className="inline" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} role="group" aria-label={t('a11y.category')}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`filter-chip ${category === c ? 'active' : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c === 'All' ? t('gov.all') : t(`category.${c.toLowerCase()}`)}</button>
        ))}
      </div>

      {places.loading && <Loading />}
      {places.error && <ErrorBox message={places.error} onRetry={places.reload} />}
      {places.data?.items.length === 0 && <Empty icon={Landmark} title={t('gov.empty')}>{t('gov.emptyText')}</Empty>}
      {places.data?.items.length > 0 && (
        <>
          <MapView places={places.data.items} height={300} />
          <div className="grid">{places.data.items.map((p) => <PlaceCard key={p.id} place={p} />)}</div>
        </>
      )}
    </>
  )
}
