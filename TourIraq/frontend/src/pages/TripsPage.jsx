import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Plus, Route, Ticket, Trash2 } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { Empty, ErrorBox, Loading, Modal, PageHeading, Segmented } from '../components/ui'
import { errorMessage, formatDate, formatPrice, todayISO } from '../utils/helpers'

const STATUS_BADGE = { Pending: 'badge-warning', Confirmed: 'badge-info', Completed: 'badge-success', Cancelled: 'badge-danger' }

function BookTripModal({ trip, onClose }) {
  const { t } = useI18n()
  const toast = useToast()
  const [start, setStart] = useState(todayISO())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const book = async () => {
    setBusy(true); setError('')
    try {
      const b = (await api.post('/bookings', { type: 'Trip', tripId: trip.id, startDate: start })).data
      toast(t('trips.bookingCreated', { id: b.id, status: t(`booking.${b.status.toLowerCase()}`) }))
      onClose(true)
    } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={() => onClose(false)} eyebrow={t('trips.bookTitle')} title={trip.title}
      footer={<><button className="btn" onClick={book} disabled={busy}><CalendarDays size={16} strokeWidth={1.75} />{busy ? t('trips.booking') : t('trips.confirmBooking')}</button><button className="btn btn-outline" onClick={() => onClose(false)}>{t('groups.cancel')}</button></>}>
      <div className="form">
        <label><span className="req">{t('trips.startDate')}</span><input type="date" min={todayISO()} value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <div className="total-bar"><span>{t('trips.days', { count: trip.durationDays })}</span><b className="num">{formatPrice(trip.price)}</b></div>
        {error && <div className="notice error" role="alert">{error}</div>}
      </div>
    </Modal>
  )
}

function TripCard({ trip, onBook }) {
  const { t, isRtl } = useI18n()
  return (
    <div className="card card-pad">
      <div className="card-title"><h3 style={{ margin: 0 }}>{trip.title}</h3>{trip.isReadyMade && <b className="num" style={{ color: 'var(--primary)' }}>{formatPrice(trip.price)}</b>}</div>
      <p className="small muted">{t('trips.days', { count: trip.durationDays })}{trip.isReadyMade ? '' : ` · ${t('trips.personal')}`}</p>
      {trip.description && <p className="small">{trip.description}</p>}
      <div className="timeline" style={{ marginBlock: 10 }}>
        {trip.days.map((d) => (
          <div key={d.dayNumber} className="t-item" style={{ padding: '4px 10px' }}>
            <span className="t-time">{t('trips.dayNumber', { day: d.dayNumber })}</span>
            <div className="small">{d.places.map((p) => isRtl ? p.nameAr || p.name : p.name).join(' → ')}</div>
          </div>
        ))}
      </div>
      {onBook && <button className="btn btn-soft btn-block" onClick={() => onBook(trip)}><Ticket size={16} strokeWidth={1.75} />{t('trips.bookTrip')}</button>}
    </div>
  )
}

function ItineraryBuilder({ onCreated }) {
  const { t, isRtl } = useI18n()
  const toast = useToast()
  const places = useFetch(async () => (await api.get('/places', { params: { pageSize: 50 } })).data.items)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState([[]])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const used = new Set(days.flat())
  const nameOf = (id) => { const place = places.data?.find((p) => p.id === id); return isRtl ? place?.nameAr || place?.name : place?.name }
  const addPlace = (i, id) => id && setDays(days.map((d, k) => (k === i ? [...d, Number(id)] : d)))
  const removePlace = (i, id) => setDays(days.map((d, k) => (k === i ? d.filter((p) => p !== id) : d)))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const payload = days.map((d, i) => ({ dayNumber: i + 1, placeIds: d })).filter((d) => d.placeIds.length)
    if (!payload.length) return setError(t('trips.addOnePlace'))
    setBusy(true)
    try {
      await api.post('/trips/custom', { title, description, days: payload })
      setTitle(''); setDescription(''); setDays([[]])
      toast(t('trips.itinerarySaved'))
      onCreated()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <label><span className="req">{t('trips.tripName')}</span><input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></label>
        <label>{t('trips.notes')}<input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} /></label>
      </div>
      {days.map((d, i) => (
        <div key={i} className="card card-pad" style={{ boxShadow: 'none' }}>
          <b style={{ color: 'var(--primary)' }}>{t('trips.dayNumber', { day: i + 1 })}</b>
          <ol style={{ paddingInlineStart: 20 }}>
            {d.map((pid) => <li key={pid}>{nameOf(pid)} <button type="button" className="icon-btn" onClick={() => removePlace(i, pid)} aria-label={t('trips.removePlace', { place: nameOf(pid) })}><Trash2 size={15} strokeWidth={1.75} /></button></li>)}
          </ol>
          <select value="" onChange={(e) => addPlace(i, e.target.value)} aria-label={t('trips.addPlaceToDay', { day: i + 1 })}>
            <option value="">+ {t('trips.addPlace')}</option>
            {places.data?.filter((p) => !used.has(p.id)).map((p) => <option key={p.id} value={p.id}>{isRtl ? p.nameAr || p.name : p.name} ({p.governorateName})</option>)}
          </select>
        </div>
      ))}
      {error && <div className="notice error" role="alert">{error}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" disabled={busy}>{busy ? t('trips.saving') : t('trips.save')}</button>
        <button type="button" className="btn btn-outline" onClick={() => setDays([...days, []])} disabled={days.length >= 14}><Plus size={16} strokeWidth={1.75} />{t('trips.addDay')}</button>
      </div>
    </form>
  )
}

export default function TripsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const isTourist = user?.role === 'Tourist'
  const [tab, setTab] = useState('ready')
  const [booking, setBooking] = useState(null)
  const trips = useFetch(async () => (await api.get('/trips', { params: { pageSize: 50 } })).data)
  const mine = useFetch(async () => (isTourist ? (await api.get('/trips/mine')).data : []), [user?.id])
  const bookings = useFetch(async () => (isTourist ? (await api.get('/bookings/me')).data : []), [user?.id])

  return (
    <>
      <PageHeading eyebrow={t('trips.eyebrow')} title={t('trips.title')} description={t('trips.desc')}
        action={<Segmented label={t('trips.tabs')} value={tab} onChange={setTab} options={[{ value: 'ready', label: t('trips.readyMade') }, { value: 'custom', label: t('trips.myPlans') }]} />} />

      {tab === 'ready' && (
        <>
          {trips.loading && <Loading />}
          {trips.error && <ErrorBox message={trips.error} onRetry={trips.reload} />}
          {trips.data?.items.length === 0 && <div className="card"><Empty icon={Route} title={t('trips.noTrips')} /></div>}
          <div className="grid">{trips.data?.items.map((tr) => <TripCard key={tr.id} trip={tr} onBook={isTourist ? setBooking : null} />)}</div>
          {!isTourist && <div className="notice info"><span>{t('trips.loginToBook')}</span><Link to="/login" className="btn btn-sm">{t('auth.login')}</Link></div>}
        </>
      )}

      {tab === 'custom' && (!isTourist ? (
        <div className="notice info"><span>{t('trips.loginToBuild')}</span><Link to="/login" className="btn btn-sm">{t('auth.login')}</Link></div>
      ) : (
        <>
          <div className="card card-pad"><h2>{t('trips.buildItinerary')}</h2><ItineraryBuilder onCreated={mine.reload} /></div>
          <h2>{t('trips.myItineraries')}</h2>
          {mine.data?.length === 0 && <div className="card"><Empty icon={Route} title={t('trips.noItineraries')}>{t('trips.createOneAbove')}</Empty></div>}
          <div className="grid">{mine.data?.map((tr) => <TripCard key={tr.id} trip={tr} />)}</div>
        </>
      ))}

      {isTourist && (
        <section>
          <h2>{t('trips.myBookings')}</h2>
          {bookings.data?.length === 0 ? <div className="card"><Empty icon={Ticket} title={t('trips.noBookings')} /></div> : (
            <div className="table-card"><div className="table-scroll"><table>
              <thead><tr><th>{t('trips.bookingColumn')}</th><th>{t('trips.dates')}</th><th>{t('trips.total')}</th><th>{t('trips.status')}</th></tr></thead>
              <tbody>{bookings.data?.map((b) => (
                <tr key={b.id}>
                  <td><b style={{ color: 'var(--primary)' }}>{b.type === 'Trip' ? b.tripTitle : b.guideName}</b><div className="small muted">{t(`booking.${b.type.toLowerCase()}Type`)}</div></td>
                  <td>{formatDate(b.startDate)} – {formatDate(b.endDate)}</td>
                  <td><span className="num">{formatPrice(b.totalPrice)}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[b.status]}`}>{t(`booking.${b.status.toLowerCase()}`)}</span></td>
                </tr>
              ))}</tbody>
            </table></div></div>
          )}
        </section>
      )}

      {booking && <BookTripModal trip={booking} onClose={(ok) => { setBooking(null); if (ok) bookings.reload() }} />}
    </>
  )
}
