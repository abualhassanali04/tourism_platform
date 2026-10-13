import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Compass, Gift, House, Languages, LogIn, LogOut, Menu, Route, Search, ShieldCheck, Stamp, UserRound, Users, UserCheck } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { Avatar, Logo } from '../components/ui'
import { CATEGORY_ICON } from '../components/PlaceCard'

function useClickOutside(ref, onOut) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onOut()
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ref, onOut])
}

function SearchBox() {
  const { t, isRtl } = useI18n()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [places, setPlaces] = useState(null)
  const ref = useRef(null)
  const input = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close)

  useEffect(() => {
    const h = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); input.current?.focus() }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const load = async () => {
    setOpen(true)
    if (!places) { try { setPlaces((await api.get('/places', { params: { pageSize: 50 } })).data.items) } catch { setPlaces([]) } }
  }
  const norm = q.trim().toLowerCase()
  const results = norm ? (places || []).filter((p) => p.name.toLowerCase().includes(norm) || p.nameAr.includes(q.trim()) || p.governorateName.toLowerCase().includes(norm)).slice(0, 6) : []

  return (
    <div className="search" ref={ref}>
      <div className="search-box">
        <Search size={16} strokeWidth={1.75} color="#91A0AE" />
        <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={load} placeholder={t('top.search')} aria-label={t('top.search')} />
        <kbd>/</kbd>
      </div>
      {open && norm && (
        <div className="dropdown">
          {results.length === 0 && <div className="small muted" style={{ padding: 12 }}>{t('top.noResults')}</div>}
          {results.map((p) => {
            const Icon = CATEGORY_ICON[p.category]
            return (
              <Link key={p.id} to={`/places/${p.id}`} className="result-row" onClick={() => { setOpen(false); setQ('') }}>
                <span className="avatar sm av-4"><Icon size={16} strokeWidth={1.75} /></span>
                <span><strong>{isRtl ? p.nameAr || p.name : p.name}</strong><span className="small muted">{p.governorateName}</span></span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth()
  const { t, toggleLang, isRtl } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const [bell, setBell] = useState(false)
  const [stamps, setStamps] = useState(0)
  const [unlocked, setUnlocked] = useState(0)
  const [adminSetupAvailable, setAdminSetupAvailable] = useState(false)
  const menuRef = useRef(null)
  const bellRef = useRef(null)
  const closeMenu = useCallback(() => setMenu(false), [])
  const closeBell = useCallback(() => setBell(false), [])
  useClickOutside(menuRef, closeMenu)
  useClickOutside(bellRef, closeBell)

  const isTourist = user?.role === 'Tourist'

  const refresh = useCallback(async () => {
    if (!isTourist) { setStamps(0); setUnlocked(0); return }
    try {
      const [p, r] = await Promise.all([api.get('/passport/me'), api.get('/rewards')])
      setStamps(p.data.totalStamps)
      setUnlocked(r.data.filter((x) => x.isUnlocked).length)
    } catch { /* non-critical */ }
  }, [isTourist])

  useEffect(() => { refresh() }, [refresh, location.pathname])
  useEffect(() => {
    let active = true
    api.get('/admin-setup/status')
      .then(({ data }) => { if (active) setAdminSetupAvailable(data.available) })
      .catch(() => { if (active) setAdminSetupAvailable(false) })
    return () => { active = false }
  }, [location.pathname])
  useEffect(() => {
    window.addEventListener('passport:changed', refresh)
    return () => window.removeEventListener('passport:changed', refresh)
  }, [refresh])
  useEffect(() => { setDrawer(false); setMenu(false); setBell(false) }, [location.pathname])

  const first = location.pathname.split('/')[1] || 'home'
  const crumb = t(`crumb.${first}`)
  const roleName = t(`role.${user?.role || 'Guest'}`)
  const today = new Date().toLocaleDateString(isRtl ? 'ar-IQ' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })

  const handleLogout = () => { logout(); setMenu(false); navigate('/') }

  return (
    <>
      <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label={t('a11y.mainNavigation')}>
        <Logo t={t} />
        <div className="status-card">
          <span className="dot-live" />
          <div>
            <strong>{isTourist ? t('status.passport') : t('status.guest')}</strong>
            <span>{isTourist ? t('status.stamps', { n: stamps }) : isAuthenticated ? today : t('status.guestSub')}</span>
          </div>
        </div>

        <div className="nav-caption">{t('nav.discover')}</div>
        <NavLink to="/" end className="nav-link"><House {...{ size: 18, strokeWidth: 1.75 }} />{t('nav.home')}</NavLink>
        <NavLink to="/guides" className="nav-link"><UserCheck size={18} strokeWidth={1.75} />{t('nav.guides')}</NavLink>
        <NavLink to="/trips" className="nav-link"><Route size={18} strokeWidth={1.75} />{t('nav.trips')}</NavLink>
        <NavLink to="/groups" className="nav-link"><Users size={18} strokeWidth={1.75} />{t('nav.groups')}</NavLink>
        {user?.role === 'Admin' && <NavLink to="/admin/places/new" className="nav-link"><ShieldCheck size={18} strokeWidth={1.75} />{t('admin.addPlace')}</NavLink>}
        {isTourist && (
          <>
            <div className="nav-caption">{t('nav.journey')}</div>
            <NavLink to="/passport" className="nav-link"><Stamp size={18} strokeWidth={1.75} />{t('nav.passport')}</NavLink>
          </>
        )}

        <div className="sidebar-bottom">
          {adminSetupAvailable && <Link to="/admin/setup" className="btn btn-outline btn-block"><ShieldCheck size={16} strokeWidth={1.75} />{t('admin.setupAction')}</Link>}
          <div className="role-card">
            <span className="role-icon"><ShieldCheck size={16} strokeWidth={1.75} /></span>
            <div><small>{t('role.current')}</small><strong>{roleName}</strong></div>
          </div>
          {isAuthenticated ? (
            <button className="btn btn-danger btn-block" onClick={handleLogout}><LogOut size={16} strokeWidth={1.75} className="flip-rtl" />{t('auth.logout')}</button>
          ) : (
            <Link to="/login" className="btn btn-block"><LogIn size={16} strokeWidth={1.75} />{t('auth.login')}</Link>
          )}
        </div>
      </aside>
      <div className={`drawer-overlay ${drawer ? 'show' : ''}`} onClick={() => setDrawer(false)} />

      <div className="main-col">
        <header className="topbar">
          <div className="inline" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="icon-btn menu-btn" onClick={() => setDrawer(true)} aria-label={t('a11y.openMenu')}><Menu size={20} /></button>
            <nav className="crumbs" aria-label={t('a11y.breadcrumb')}><Compass size={15} strokeWidth={1.75} /><span><bdi>{t('brand')}</bdi></span><span className="sep">/</span><b>{crumb}</b></nav>
          </div>

          <div className="topbar-actions">
            <SearchBox />
            <button className="btn btn-outline btn-sm" onClick={toggleLang} aria-label={t('a11y.changeLanguage')}><Languages size={16} strokeWidth={1.75} />{t('top.lang')}</button>

            {isTourist && (
              <div className="rel" ref={bellRef}>
                <button className="icon-btn lg bell" onClick={() => setBell(!bell)} aria-label={t('top.notifications')} aria-expanded={bell}>
                  <Bell size={19} strokeWidth={1.75} />{unlocked > 0 && <span className="dot" />}
                </button>
                {bell && (
                  <div className="dropdown notif">
                    <b style={{ color: 'var(--primary)' }}>{t('top.notifications')}</b>
                    {unlocked > 0 ? (
                      <Link to="/passport" className="result-row" style={{ marginTop: 8 }}>
                        <span className="avatar sm av-1"><Gift size={16} strokeWidth={1.75} /></span><span>{t('top.rewards', { n: unlocked })}</span>
                      </Link>
                    ) : <p className="muted small" style={{ margin: '8px 0 0' }}>{t('top.noNotif')}</p>}
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <div className="rel" ref={menuRef}>
                <button className="account-btn" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-haspopup="menu">
                  <Avatar name={user.fullName} size="sm" />
                  <span className="who"><b>{user.fullName}</b><small>{roleName}</small></span>
                  <ChevronDown size={16} className={`chev ${menu ? 'open' : ''}`} />
                </button>
                {menu && (
                  <div className="dropdown account-menu" role="menu">
                    <Avatar name={user.fullName} size="lg" />
                    <h3 style={{ margin: 0 }}>{user.fullName}</h3>
                    <p className="small" style={{ margin: 0 }}>{roleName}</p>
                    <p className="small muted" style={{ margin: 0 }}><span className="ltr">{user.email}</span></p>
                    <hr />
                    <button className="btn btn-logout" onClick={handleLogout} role="menuitem"><LogOut size={16} strokeWidth={1.75} className="flip-rtl" />{t('auth.logout')}</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/register" className="btn btn-sm"><UserRound size={16} strokeWidth={1.75} />{t('auth.signup')}</Link>
            )}
          </div>
        </header>

        <main className="content"><Outlet /></main>
        <div className="site-footer"><bdi>{t('common.footer', { year: new Date().getFullYear() })}</bdi></div>
      </div>
    </>
  )
}
