import { Link } from 'react-router-dom'
import { ArrowLeft, Landmark, Map, Route, Stamp, UserCheck } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useI18n } from '../i18n/I18nContext'
import { Empty, ErrorBox, Loading, StatCard } from '../components/ui'
import PlaceCard from '../components/PlaceCard'
import MapView from '../components/MapView'

export default function Home() {
  const { t, isRtl } = useI18n()
  const governorates = [{ en: 'Baghdad', ar: 'بغداد' }, { en: 'Najaf', ar: 'النجف' }, { en: 'Karbala', ar: 'كربلاء' }, { en: 'Babylon', ar: 'بابل' }]
  const data = useFetch(async () => {
    const [govs, places, guides, trips] = await Promise.all([
      api.get('/governorates'),
      api.get('/places', { params: { pageSize: 50 } }),
      api.get('/guides', { params: { pageSize: 1 } }),
      api.get('/trips', { params: { pageSize: 1 } }),
    ])
    return { govs: govs.data, places: places.data.items, placesTotal: places.data.totalCount, guides: guides.data.totalCount, trips: trips.data.totalCount }
  })
  const d = data.data

  return (
    <>
      <section className="hero-card">
        <div>
          <span className="eyebrow">{t('home.eyebrow')}</span>
          <h2>{t('home.heroTitle')}</h2>
          <p>{t('home.heroText')}</p>
          <div className="chips">
            {governorates.map((governorate) => <span key={governorate.en} className="chip">{isRtl ? governorate.ar : governorate.en}</span>)}
          </div>
          <Link to="/passport" className="btn btn-glass"><Stamp size={16} strokeWidth={1.75} />{t('home.cta')}</Link>
        </div>
        <div className="orb" aria-label={`${d?.placesTotal ?? 0} ${t('home.attractions')}`}><b className="num">{d?.placesTotal ?? '–'}</b><span>{t('home.attractions')}</span></div>
      </section>

      {data.loading && <Loading />}
      {data.error && <ErrorBox message={data.error} onRetry={data.reload} />}

      {d && (
        <>
          <div className="grid grid-4">
            <StatCard icon={Map} tone="green" value={d.govs.length} label={t('stat.governorates')} />
            <StatCard icon={Landmark} tone="sand" value={d.placesTotal} label={t('stat.places')} />
            <StatCard icon={UserCheck} tone="info" value={d.guides} label={t('stat.guides')} />
            <StatCard icon={Route} tone="coral" value={d.trips} label={t('stat.trips')} />
          </div>

          <section>
            <h2>{t('home.byGov')}</h2>
            <div className="grid grid-2">
              {d.govs.map((g) => (
                <Link key={g.id} to={`/governorates/${g.id}`} className="card gov-card">
                  <h3>{isRtl ? g.nameAr : g.name} <span className="muted" lang={isRtl ? 'en' : 'ar'}>{isRtl ? g.name : g.nameAr}</span></h3>
                  <p className="small" lang={isRtl ? 'ar' : 'en'} dir={isRtl ? 'rtl' : 'ltr'}>{isRtl ? g.descriptionAr || g.description : g.description}</p>
                  <span className="pill pill-green"><span className="num">{g.placesCount}</span> {t('gov.places')}</span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2>{t('home.featured')}</h2>
            {d.places.length === 0 ? <Empty icon={Landmark} title={t('gov.empty')} /> : (
              <div className="grid">{d.places.slice(0, 6).map((p) => <PlaceCard key={p.id} place={p} />)}</div>
            )}
          </section>

          <section>
            <h2>{t('home.map')}</h2>
            <MapView places={d.places} height={400} />
          </section>
        </>
      )}
    </>
  )
}
