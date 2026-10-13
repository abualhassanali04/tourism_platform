import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { Avatar, ErrorBox, Loading } from '../components/ui'
import { Stars } from './GuidesPage'
import { errorMessage, formatDate, formatPrice, todayISO } from '../utils/helpers'

function BookingForm({ guide }) {
  const { t } = useI18n()
  const toast = useToast()
  const [start, setStart] = useState(todayISO())
  const [end, setEnd] = useState(todayISO())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const days = Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000) + 1)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const b = (await api.post('/bookings', { type: 'Guide', guideUserId: guide.userId, startDate: start, endDate: end })).data
      toast(t('guide.bookingCreated', { id: b.id, status: t(`booking.${b.status.toLowerCase()}`) }))
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <label><span className="req">{t('guide.startDate')}</span><input type="date" min={todayISO()} value={start} onChange={(e) => setStart(e.target.value)} required /></label>
        <label><span className="req">{t('guide.endDate')}</span><input type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} required /></label>
      </div>
      <div className="total-bar"><span>{days === 1 ? t('guide.dayCountOne') : t('guide.dayCount', { count: days })} × <span className="num">{formatPrice(guide.pricePerDay)}</span></span><b className="num">{days > 0 ? formatPrice(guide.pricePerDay * days) : '—'}</b></div>
      {error && <div className="notice error" role="alert">{error}</div>}
      <button className="btn" disabled={busy || days < 1}><CalendarDays size={16} strokeWidth={1.75} />{busy ? t('trips.booking') : t('guide.book')}</button>
    </form>
  )
}

function ReviewForm({ guideId, bookingId, onDone }) {
  const { t } = useI18n()
  const toast = useToast()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api.post(`/guides/${guideId}/reviews`, { bookingId, rating: Number(rating), comment })
      toast(t('guide.thankReview'))
      onDone()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>{t('guide.rating')}<select value={rating} onChange={(e) => setRating(e.target.value)}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select></label>
      <label>{t('guide.comment')}<textarea rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
      {error && <div className="notice error" role="alert">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? t('guide.sending') : t('guide.submitReview')}</button>
    </form>
  )
}

export default function GuideDetailPage() {
  const { id } = useParams()
  const { t } = useI18n()
  const { user } = useAuth()
  const guide = useFetch(async () => (await api.get(`/guides/${id}`)).data, [id])
  const myBookings = useFetch(async () => (user?.role === 'Tourist' ? (await api.get('/bookings/me')).data : []), [user?.id, id])

  if (guide.loading) return <Loading />
  if (guide.error) return <ErrorBox message={guide.error} onRetry={guide.reload} />
  const g = guide.data
  const reviewable = myBookings.data?.find((b) => b.canReview && String(b.guideUserId) === String(id))
  const languageLabel = (language) => {
    const key = `language.${language.toLowerCase()}`
    const translated = t(key)
    return translated === key ? language : translated
  }

  return (
    <>
      <Link to="/guides" className="small" style={{ fontWeight: 700 }}><ArrowLeft size={14} className="flip-rtl" style={{ verticalAlign: -2 }} /> {t('guide.all')}</Link>

      <div className="card card-pad">
        <div className="person" style={{ marginBottom: 14 }}>
          <Avatar name={g.fullName} size="lg" />
          <div><h1 style={{ margin: 0, fontSize: 24 }}>{g.fullName}</h1><span><Stars value={g.avgRating} /> {g.reviewsCount ? <span className="num">{g.avgRating.toFixed(1)} · {g.reviewsCount}</span> : t('guide.noReviews')} · {g.country}</span></div>
        </div>
        <p>{g.bio}</p>
        <div className="grid" style={{ marginTop: 8 }}>
          <div><span className="small muted">{t('guide.languages')}</span><div>{g.languages.map((l) => <span key={l} className="pill pill-green">{languageLabel(l)}</span>)}</div></div>
          <div><span className="small muted">{t('guide.price')}</span><div><b style={{ color: 'var(--primary)', fontSize: 18 }}><span className="num">{formatPrice(g.pricePerDay)}</span> {t('guides.perDay')}</b></div></div>
          <div><span className="small muted">{t('guide.destinations')}</span><div>{g.destinations.map((d) => <Link key={d.id} to={`/places/${d.id}`} className="pill" style={{ textDecoration: 'none' }}>{d.name}</Link>)}</div></div>
        </div>
      </div>

      <div className="split">
        <section>
          <h2>{t('guide.reviews')}</h2>
          {g.reviews.length === 0 && <p className="muted">{t('guide.noReviews')}</p>}
          <div style={{ display: 'grid', gap: 12 }}>
            {g.reviews.map((r) => (
              <div key={r.id} className="card card-pad">
                <div className="person"><Avatar name={r.touristName} size="sm" /><div><b>{r.touristName}</b><span><Stars value={r.rating} /> · {formatDate(r.createdAt)}</span></div></div>
                <p style={{ margin: '8px 0 0' }}>{r.comment}</p>
              </div>
            ))}
          </div>
        </section>
        <aside style={{ display: 'grid', gap: 18 }}>
          <div className="card card-pad">
            <h2>{t('guide.book')}</h2>
            {!user && <div className="notice info"><span>{t('guide.loginToBook')}</span><Link to="/login" state={{ from: `/guides/${id}` }} className="btn btn-sm">{t('auth.login')}</Link></div>}
            {user && user.role !== 'Tourist' && <div className="notice info">{t('guide.onlyTouristsBook')}</div>}
            {user?.role === 'Tourist' && <BookingForm guide={g} />}
          </div>
          {reviewable && <div className="card card-pad"><h2>{t('guide.reviewTitle')}</h2><ReviewForm guideId={id} bookingId={reviewable.id} onDone={() => { guide.reload(); myBookings.reload() }} /></div>}
        </aside>
      </div>
    </>
  )
}
