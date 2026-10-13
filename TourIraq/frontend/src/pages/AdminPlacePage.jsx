import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Save, Trash2 } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { ErrorBox, Loading, PageHeading } from '../components/ui'
import { errorMessage } from '../utils/helpers'

const CATEGORIES = ['Archaeological', 'Religious', 'Heritage', 'Nature', 'Other']
const EVENT_TYPES = ['Story', 'Battle', 'Construction', 'Other']

const emptyEvent = () => ({ title: '', titleAr: '', eventType: 'Story', year: '', era: '', summary: '', summaryAr: '', details: '', detailsAr: '' })
const emptyForm = () => ({
  governorateId: '', name: '', nameAr: '', shortDescription: '', shortDescriptionAr: '', description: '', descriptionAr: '',
  category: 'Archaeological', latitude: '', longitude: '', stampRadiusMeters: 150,
  safetyNotes: '', safetyNotesAr: '', culturalTips: '', culturalTipsAr: '',
})

export default function AdminPlacePage() {
  const { t, isRtl } = useI18n()
  const toast = useToast()
  const governorates = useFetch(async () => (await api.get('/governorates')).data)
  const [form, setForm] = useState(emptyForm())
  const [events, setEvents] = useState([emptyEvent()])
  const [cover, setCover] = useState(null)
  const [gallery, setGallery] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const setEvent = (i, key) => (e) => setEvents(events.map((ev, idx) => (idx === i ? { ...ev, [key]: e.target.value } : ev)))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!cover) return setError(t('admin.coverImage'))
    if (gallery.length > 5) return setError(t('admin.uploadHelp'))
    if (events.length === 0) return setError(t('admin.noEvents'))

    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== null) data.append(key, value)
    })
    data.append('coverImage', cover)
    gallery.forEach((file) => data.append('images', file))
    events.forEach((ev, i) => {
      Object.entries(ev).forEach(([key, value]) => {
        if (value !== '' && value !== null) data.append(`historicalEvents[${i}].${key}`, value)
      })
    })

    setBusy(true)
    try {
      const res = await api.post('/admin/places', data)
      setCreated(res.data)
      toast(t('admin.placeCreated'))
      setForm(emptyForm()); setEvents([emptyEvent()]); setCover(null); setGallery([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (governorates.loading) return <Loading />
  if (governorates.error) return <ErrorBox message={governorates.error} onRetry={governorates.reload} />

  return (
    <>
      <PageHeading eyebrow={t('admin.addPlace')} title={t('admin.placeTitle')} description={t('admin.placeDescription')} />
      {created && (
        <div className="notice success" role="status">
          {t('admin.placeCreated')} <Link to={`/places/${created.id}`}>{t('admin.openPlace')}</Link>
        </div>
      )}

      <form className="card card-pad form" onSubmit={submit}>
        <h3 style={{ margin: 0 }}>{t('admin.placeDetails')}</h3>
        <div className="form-grid">
          <label><span className="req">{t('admin.governorate')}</span>
            <select value={form.governorateId} onChange={set('governorateId')} required>
              <option value="">{t('admin.chooseGovernorate')}</option>
              {governorates.data.map((g) => <option key={g.id} value={g.id}>{isRtl ? g.nameAr || g.name : g.name}</option>)}
            </select>
          </label>
          <label><span className="req">{t('admin.category')}</span>
            <select value={form.category} onChange={set('category')} required>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label><span className="req">{t('admin.nameEn')}</span><input value={form.name} onChange={set('name')} maxLength={160} required /></label>
          <label><span className="req">{t('admin.nameAr')}</span><input dir="rtl" value={form.nameAr} onChange={set('nameAr')} maxLength={160} required /></label>
        </div>
        <div className="form-grid">
          <label><span className="req">{t('admin.shortEn')}</span><textarea rows={2} value={form.shortDescription} onChange={set('shortDescription')} maxLength={500} required /></label>
          <label><span className="req">{t('admin.shortAr')}</span><textarea dir="rtl" rows={2} value={form.shortDescriptionAr} onChange={set('shortDescriptionAr')} maxLength={500} required /></label>
        </div>
        <div className="form-grid">
          <label><span className="req">{t('admin.descriptionEn')}</span><textarea rows={5} value={form.description} onChange={set('description')} maxLength={8000} required /></label>
          <label><span className="req">{t('admin.descriptionAr')}</span><textarea dir="rtl" rows={5} value={form.descriptionAr} onChange={set('descriptionAr')} maxLength={8000} required /></label>
        </div>
        <div className="form-grid">
          <label><span className="req">{t('admin.latitude')}</span><input className="ltr" type="number" step="any" min={-90} max={90} value={form.latitude} onChange={set('latitude')} required /></label>
          <label><span className="req">{t('admin.longitude')}</span><input className="ltr" type="number" step="any" min={-180} max={180} value={form.longitude} onChange={set('longitude')} required /></label>
        </div>
        <label>{t('admin.radius')}<input className="ltr" type="number" min={25} max={2000} value={form.stampRadiusMeters} onChange={set('stampRadiusMeters')} /></label>
        <div className="form-grid">
          <label>{t('admin.safetyEn')}<textarea rows={3} value={form.safetyNotes} onChange={set('safetyNotes')} maxLength={4000} /></label>
          <label>{t('admin.safetyAr')}<textarea dir="rtl" rows={3} value={form.safetyNotesAr} onChange={set('safetyNotesAr')} maxLength={4000} /></label>
        </div>
        <div className="form-grid">
          <label>{t('admin.tipsEn')}<textarea rows={3} value={form.culturalTips} onChange={set('culturalTips')} maxLength={4000} /></label>
          <label>{t('admin.tipsAr')}<textarea dir="rtl" rows={3} value={form.culturalTipsAr} onChange={set('culturalTipsAr')} maxLength={4000} /></label>
        </div>

        <div className="form-grid">
          <label><span className="req">{t('admin.coverImage')}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCover(e.target.files?.[0] || null)} required />
          </label>
          <label>{t('admin.galleryImages')}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setGallery(Array.from(e.target.files || []).slice(0, 5))} />
          </label>
        </div>
        <span className="small muted">{t('admin.uploadHelp')}</span>

        <h3 style={{ margin: '12px 0 0' }}>{t('admin.historicalEvents')}</h3>
        {events.map((ev, i) => (
          <div key={i} className="card card-pad" style={{ boxShadow: 'none', display: 'grid', gap: 14 }}>
            <div className="form-grid">
              <label><span className="req">{t('admin.eventTitleEn')}</span><input value={ev.title} onChange={setEvent(i, 'title')} maxLength={180} required /></label>
              <label>{t('admin.eventTitleAr')}<input dir="rtl" value={ev.titleAr} onChange={setEvent(i, 'titleAr')} maxLength={180} /></label>
            </div>
            <div className="form-grid">
              <label><span className="req">{t('admin.eventType')}</span>
                <select value={ev.eventType} onChange={setEvent(i, 'eventType')}>{EVENT_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select>
              </label>
              <div className="form-grid">
                <label>{t('admin.eventYear')}<input className="ltr" type="number" value={ev.year} onChange={setEvent(i, 'year')} /></label>
                <label>{t('admin.eventEra')}<input value={ev.era} onChange={setEvent(i, 'era')} maxLength={100} /></label>
              </div>
            </div>
            <div className="form-grid">
              <label><span className="req">{t('admin.summaryEn')}</span><textarea rows={2} value={ev.summary} onChange={setEvent(i, 'summary')} maxLength={1000} required /></label>
              <label>{t('admin.summaryAr')}<textarea dir="rtl" rows={2} value={ev.summaryAr} onChange={setEvent(i, 'summaryAr')} maxLength={1000} /></label>
            </div>
            <div className="form-grid">
              <label><span className="req">{t('admin.detailsEn')}</span><textarea rows={4} value={ev.details} onChange={setEvent(i, 'details')} maxLength={8000} required /></label>
              <label>{t('admin.detailsAr')}<textarea dir="rtl" rows={4} value={ev.detailsAr} onChange={setEvent(i, 'detailsAr')} maxLength={8000} /></label>
            </div>
            {events.length > 1 && (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => setEvents(events.filter((_, idx) => idx !== i))}>
                <Trash2 size={15} strokeWidth={1.75} />{t('admin.removeEvent')}
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setEvents([...events, emptyEvent()])}>
          <Plus size={16} strokeWidth={1.75} />{t('admin.addEvent')}
        </button>

        {error && <div className="notice error" role="alert">{error}</div>}
        <button className="btn btn-lg" disabled={busy}><Save size={18} strokeWidth={1.75} />{busy ? t('admin.savingPlace') : t('admin.savePlace')}</button>
      </form>
    </>
  )
}
