import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, LocateFixed, ShieldCheck, Stamp, Handshake, MapPin, Pause, Play, Square } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { ErrorBox, Loading, PageHeading, Stepper } from '../components/ui'
import { CATEGORY_ICON } from '../components/PlaceCard'
import MapView from '../components/MapView'
import { errorMessage, imageUrl } from '../utils/helpers'

function yearLabel(e, isRtl) {
  if (e.year == null) return e.era || ''
  return e.year < 0 ? `${Math.abs(e.year)} ${isRtl ? 'ق.م' : 'BCE'}` : `${e.year} ${isRtl ? 'م' : 'CE'}`
}

function AudioGuide({ events, isRtl, t }) {
  const [playback, setPlayback] = useState('idle')
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [events, isRtl])

  const speak = () => {
    if (!supported) return

    const hasArabicStory = events.every((event) => event.titleAr && event.summaryAr && event.detailsAr)
    const useArabic = isRtl && hasArabicStory
    const story = events.map((event) => [
      useArabic ? event.titleAr : event.title,
      useArabic ? event.summaryAr : event.summary,
      useArabic ? event.detailsAr : event.details,
    ].filter(Boolean).join('. ')).join('\n\n')
    const utterance = new SpeechSynthesisUtterance(story)
    utterance.lang = useArabic ? 'ar-IQ' : 'en-US'
    const voicePrefix = useArabic ? 'ar' : 'en'
    const voices = window.speechSynthesis.getVoices()
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith(`${voicePrefix}-iq`))
      || voices.find((voice) => voice.lang.toLowerCase().startsWith(voicePrefix))
      || null
    utterance.onend = () => setPlayback('idle')
    utterance.onerror = () => setPlayback('idle')

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setPlayback('playing')
  }

  const togglePlayback = () => {
    if (playback === 'playing') {
      window.speechSynthesis.pause()
      setPlayback('paused')
    } else if (playback === 'paused') {
      window.speechSynthesis.resume()
      setPlayback('playing')
    } else {
      speak()
    }
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setPlayback('idle')
  }

  return (
    <div className="audio-guide" role="group" aria-label={t('place.audioPlay')} dir={isRtl ? 'rtl' : 'ltr'}>
      {supported ? (
        <>
          <button type="button" className="btn btn-soft btn-sm" onClick={togglePlayback}>
            {playback === 'playing' ? <Pause size={16} /> : <Play size={16} />}
            {playback === 'playing' ? t('place.audioPause') : playback === 'paused' ? t('place.audioResume') : t('place.audioPlay')}
          </button>
          {playback !== 'idle' && <button type="button" className="btn btn-ghost btn-sm" onClick={stop}><Square size={15} />{t('place.audioStop')}</button>}
          <span className="small muted" aria-live="polite">{playback === 'playing' ? t('place.audioPlaying') : playback === 'paused' ? t('place.audioPaused') : ''}</span>
        </>
      ) : <p className="note">{t('place.audioUnavailable')}</p>}
    </div>
  )
}

function StampCollector({ place }) {
  const { t, isRtl } = useI18n()
  const { user } = useAuth()
  const toast = useToast()
  const [position, setPosition] = useState(null)
  const [locating, setLocating] = useState(false)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  if (!user) {
    return <div className="notice info"><span>{t('place.loginToStamp')}</span><Link className="btn btn-sm" to="/login" state={{ from: `/places/${place.id}` }}>{t('auth.login')}</Link></div>
  }
  if (user.role !== 'Tourist') return <div className="notice info">{t('place.onlyTouristsStamp')}</div>

  const step = result ? 3 : file ? 2 : position ? 1 : 0
  const placeName = isRtl ? place.nameAr || place.name : place.name

  const locate = () => {
    setError('')
    if (!('geolocation' in navigator)) return setError(t('place.locationUnsupported'))
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); setLocating(false) },
      (err) => { setLocating(false); setError(err.code === 1 ? t('place.locationDenied') : t('place.locationFailed')) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!position) return setError(t('place.getLocationFirst'))
    if (!file) return setError(t('place.takePhotoFirst'))
    const fd = new FormData()
    fd.append('placeId', place.id); fd.append('lat', position.lat); fd.append('lng', position.lng); fd.append('photo', file)
    setBusy(true)
    try {
      const data = (await api.post('/stamps', fd)).data
      setResult(data)
      window.dispatchEvent(new Event('passport:changed'))
      toast(t('place.stampSuccess', { place: placeName }))
      data.newlyUnlockedRewards.forEach((r) => toast(t('place.rewardUnlocked', { reward: r.title })))
    } catch (err) {
      setError(errorMessage(err))
    } finally { setBusy(false) }
  }

  return (
    <div className="card card-pad">
      <Stepper steps={[t('place.location'), t('place.photoStep'), t('place.stampStep')]} current={step} />
      {result ? (
        <div className="dark-card">
          <span className="label">{t('place.stampCollected')}</span>
          <div className="big-num"><span className="num">{result.totalStamps}</span> <span style={{ fontSize: 16 }}>{t('place.totalStamps')}</span></div>
          <p style={{ color: 'rgba(255,255,255,.8)' }}>{t('place.distanceFrom', { distance: Math.round(result.distanceMeters), place: placeName })}</p>
          {result.newlyUnlockedRewards.map((r) => <p key={r.rewardId} style={{ margin: 0 }}>🎁 {r.title} — {r.partnerName}</p>)}
          <Link to="/passport" className="btn btn-glass btn-sm" style={{ marginTop: 12 }}><Stamp size={16} strokeWidth={1.75} />{t('place.openPassport')}</Link>
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-soft" onClick={locate} disabled={locating}><LocateFixed size={16} strokeWidth={1.75} />{locating ? t('place.locating') : position ? t('place.updateLocation') : t('place.getLocation')}</button>
            {position && <span className="badge badge-success">±{Math.round(position.accuracy)} m</span>}
          </div>
          <label>{t('place.photoLabel')}
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {error && <div className="notice error" role="alert">{error}</div>}
          <button className="btn" disabled={busy}><Camera size={16} strokeWidth={1.75} />{busy ? t('place.verifying') : t('place.collectStamp')}</button>
          <p className="note"><ShieldCheck size={16} strokeWidth={1.75} />{t('place.distanceNotice', { distance: place.stampRadiusMeters })}</p>
        </form>
      )}
    </div>
  )
}

export default function PlacePage() {
  const { id } = useParams()
  const { t, isRtl } = useI18n()
  const { data: place, loading, error, reload } = useFetch(async () => (await api.get(`/places/${id}`)).data, [id])

  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} onRetry={reload} />
  if (!place) return null

  const Icon = CATEGORY_ICON[place.category] || MapPin
  const cover = imageUrl(place.coverImageUrl)
  const firstEvent = place.historicalEvents[0]?.id

  return (
    <>
      <Link to={`/governorates/${place.governorateId}`} className="small" style={{ fontWeight: 700 }}><ArrowLeft size={14} className="flip-rtl" style={{ verticalAlign: -2 }} /> {isRtl && ['Baghdad', 'Najaf', 'Karbala', 'Babylon'].includes(place.governorateName) ? t(`gov.name.${place.governorateName.toLowerCase()}`) : place.governorateName}</Link>
      <div className={`place-hero cat-${place.category}`}>{cover ? <img src={cover} alt={place.name} /> : <Icon size={72} strokeWidth={1.2} />}</div>
      <PageHeading
        eyebrow={t(`category.${place.category.toLowerCase()}`)}
        title={<>{isRtl ? place.nameAr || place.name : place.name} <span className="muted" lang={isRtl ? 'en' : 'ar'}>{isRtl ? place.name : place.nameAr}</span></>}
        description={isRtl ? place.descriptionAr || place.description : place.description}
      />
      {place.images.length > 0 && <div className="gallery">{place.images.map((i) => <img key={i.id} src={imageUrl(i.url)} alt={i.caption || place.name} loading="lazy" />)}</div>}

      <div className="split">
        <section>
          <h2>{t('place.history')}</h2>
          {place.historicalEvents.length > 0 && <AudioGuide events={place.historicalEvents} isRtl={isRtl} t={t} />}
          {place.historicalEvents.length === 0 ? <p className="muted">{t('place.noStories')}</p> : (
            <div className="timeline">
              {place.historicalEvents.map((e) => (
                <div key={e.id} className={`t-item ${e.id === firstEvent ? 'next' : ''}`}>
                  <span className="t-time">{yearLabel(e, isRtl)}</span> <span className="badge badge-info">{t(`event.${e.eventType.toLowerCase()}`)}</span>
                  <h3 lang={isRtl && e.titleAr ? 'ar' : 'en'} dir={isRtl && e.titleAr ? 'rtl' : 'ltr'} style={{ marginBlock: 4 }}>{isRtl ? e.titleAr || e.title : e.title}</h3>
                  <p lang={isRtl && e.summaryAr ? 'ar' : 'en'} dir={isRtl && e.summaryAr ? 'rtl' : 'ltr'} style={{ margin: 0 }}>{isRtl ? e.summaryAr || e.summary : e.summary}</p>
                  <details><summary>{t('place.readMore')}</summary><p lang={isRtl && e.detailsAr ? 'ar' : 'en'} dir={isRtl && e.detailsAr ? 'rtl' : 'ltr'} style={{ marginTop: 8 }}>{isRtl ? e.detailsAr || e.details : e.details}</p></details>
                </div>
              ))}
            </div>
          )}
        </section>
        <aside style={{ display: 'grid', gap: 18 }}>
          <div><h2>{t('place.stamp')}</h2><StampCollector place={place} /></div>
        </aside>
      </div>

      <section>
        <h2>{t('place.location')}</h2>
        <MapView places={[place]} height={320} radius={place.stampRadiusMeters} link={false} />
      </section>

      {(place.culturalTips || place.safetyNotes) && (
        <div className="grid grid-2">
          {place.culturalTips && <div className="card card-pad"><h3><Handshake size={18} strokeWidth={1.75} style={{ verticalAlign: -3 }} /> {t('place.tips')}</h3><p lang={isRtl && place.culturalTipsAr ? 'ar' : 'en'} dir={isRtl && place.culturalTipsAr ? 'rtl' : 'ltr'}>{isRtl ? place.culturalTipsAr || place.culturalTips : place.culturalTips}</p></div>}
          {place.safetyNotes && <div className="card card-pad"><h3><ShieldCheck size={18} strokeWidth={1.75} style={{ verticalAlign: -3 }} /> {t('place.safety')}</h3><p lang={isRtl && place.safetyNotesAr ? 'ar' : 'en'} dir={isRtl && place.safetyNotesAr ? 'rtl' : 'ltr'}>{isRtl ? place.safetyNotesAr || place.safetyNotes : place.safetyNotes}</p></div>}
        </div>
      )}
    </>
  )
}
