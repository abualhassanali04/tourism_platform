import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Compass, X } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

export const ICON = { size: 18, strokeWidth: 1.75 }

export function Logo({ t, to = '/', onClick }) {
  return (
    <Link to={to} className="logo" onClick={onClick}>
      <span className="logo-mark"><Compass size={20} strokeWidth={1.75} /></span>
      <span className="logo-text"><bdi>{t('brand')}</bdi><small>{t('brandSub')}</small></span>
    </Link>
  )
}

export function Avatar({ name = '?', size = '', index }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const i = index ?? (name.charCodeAt(0) || 0) % 5
  return <span className={`avatar av-${i} ${size}`} aria-hidden="true">{initials}</span>
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ icon: Icon, tone = 'green', value, label }) {
  return (
    <div className="card stat">
      <span className={`stat-tile tile-${tone}`}><Icon size={22} strokeWidth={1.75} /></span>
      <div><b className="num">{value}</b><span>{label}</span></div>
    </div>
  )
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={value === o.value ? 'active' : ''} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stepper({ steps, current }) {
  const { t } = useI18n()
  return (
    <div className="stepper" aria-label={t('a11y.progress')}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'contents' }}>
          <div className={`step ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`} aria-current={i === current ? 'step' : undefined}>
            <i>{i + 1}</i><span>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  )
}

const DONUT_COLORS = ['#08763D', '#79C936', '#E7A85D', '#E77C63', '#7B8FE0']

export function Donut({ segments, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  let acc = 0
  const stops = total
    ? segments.map((s, i) => { const from = (acc / total) * 100; acc += s.value; return `${DONUT_COLORS[i % 5]} ${from}% ${(acc / total) * 100}%` }).join(', ')
    : '#E9F1E4 0 100%'
  return (
    <div className="inline" style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
      <div className="donut" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        <div className="donut-center"><b className="num">{total}</b><span>{centerLabel}</span></div>
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        {segments.map((s, i) => (
          <div key={s.label} className="legend-row">
            <span><i style={{ background: DONUT_COLORS[i % 5] }} />{s.label}</span><b className="num">{s.value}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, eyebrow, title, children, footer, wide }) {
  const { t } = useI18n()
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div className="modal-head">
          <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
          <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}><X size={18} /></button>
        </div>
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Loading() {
  const { t } = useI18n()
  return <div className="empty" role="status"><div className="spinner" aria-hidden="true" /><span className="muted">{t('common.loading')}</span></div>
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{Icon && <Icon size={26} strokeWidth={1.75} />}</div>
      <b>{title}</b>
      {children && <p>{children}</p>}
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useI18n()
  return (
    <div className="notice error" role="alert">
      <span>{message}</span>
      {onRetry && <button className="btn btn-sm btn-outline" onClick={onRetry}>{t('common.retry')}</button>}
    </div>
  )
}
