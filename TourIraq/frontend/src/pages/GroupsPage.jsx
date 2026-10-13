import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import api from '../api/client'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { Avatar, Empty, ErrorBox, Loading, Modal, PageHeading } from '../components/ui'
import { errorMessage, formatDate, todayISO } from '../utils/helpers'

const GENDER_LABEL = { MenOnly: 'groups.menOnly', WomenOnly: 'groups.womenOnly', Mixed: 'groups.mixed' }
const STATUS_BADGE = { Approved: 'badge-success', Pending: 'badge-warning', Rejected: 'badge-danger' }

function CreatorPanel({ group }) {
  const { t } = useI18n()
  const toast = useToast()
  const members = useFetch(async () => (await api.get(`/groups/${group.id}/members`)).data, [group.id])
  const decide = async (userId, status) => {
    try { await api.put(`/groups/${group.id}/members/${userId}`, { status }); toast(t('groups.statusDecision', { status: t(`group.status.${status.toLowerCase()}`).toLowerCase() })); members.reload() }
    catch (e) { toast(errorMessage(e), 'error') }
  }
  return (
    <div style={{ marginTop: 14 }}>
      <b style={{ color: 'var(--primary)' }}>{t('groups.joinRequests')}</b>
      {members.loading && <Loading />}
      {members.data?.length === 0 && <p className="muted small">{t('groups.noRequests')}</p>}
      {members.data?.length > 0 && (
        <div className="table-card" style={{ marginTop: 8, boxShadow: 'none' }}><div className="table-scroll"><table><tbody>
          {members.data.map((m) => (
            <tr key={m.userId}>
              <td><div className="person"><Avatar name={m.fullName} size="sm" /><div><b>{m.fullName}</b><span>{m.country}</span></div></div></td>
              <td><span className={`badge ${STATUS_BADGE[m.status]}`}>{t(`group.status.${m.status.toLowerCase()}`)}</span></td>
              <td>{m.status === 'Pending' && <span style={{ display: 'flex', gap: 6 }}><button className="btn btn-sm" onClick={() => decide(m.userId, 'Approved')}>{t('groups.approve')}</button><button className="btn btn-sm btn-danger" onClick={() => decide(m.userId, 'Rejected')}>{t('groups.reject')}</button></span>}</td>
            </tr>
          ))}
        </tbody></table></div></div>
      )}
    </div>
  )
}

function GroupCard({ group, user, onChanged }) {
  const { t } = useI18n()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const isCreator = user?.id === group.creatorId
  const canJoin = user?.role === 'Tourist' && !isCreator && !group.myStatus
  const pct = Math.min(100, (group.membersCount / group.maxMembers) * 100)

  const join = async () => {
    setBusy(true)
    try { await api.post(`/groups/${group.id}/join`); toast(t('groups.requestSent')); onChanged() }
    catch (e) { toast(errorMessage(e), 'error') } finally { setBusy(false) }
  }

  return (
    <div className="card card-pad">
      <div className="card-title"><h3 style={{ margin: 0 }}>{group.name}</h3><span className="badge badge-info">{t(GENDER_LABEL[group.genderType])}</span></div>
      <p className="small">{group.description}</p>
      <p className="small muted">{t('groups.by', { name: group.creatorName })} · {t('groups.starts', { date: formatDate(group.startDate) })}{group.tripTitle ? ` · ${group.tripTitle}` : ''}</p>
      <div className="small" style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('groups.members')}</span><b className="num">{group.membersCount}/{group.maxMembers}</b></div>
      <div className="progress" style={{ marginBlock: 6 }}><span style={{ width: `${pct}%` }} /></div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        {group.myStatus && <span className={`badge ${STATUS_BADGE[group.myStatus]}`}>{t('groups.requestStatus', { status: t(`group.status.${group.myStatus.toLowerCase()}`) })}</span>}
        {isCreator && <span className="badge badge-success">{t('groups.createdByYou')}</span>}
        {canJoin && <button className="btn btn-soft btn-sm" onClick={join} disabled={busy}>{busy ? t('common.loading') : t('groups.requestJoin')}</button>}
      </div>
      {isCreator && <CreatorPanel group={group} />}
    </div>
  )
}

function CreateGroupModal({ onClose }) {
  const { t } = useI18n()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', description: '', genderType: 'Mixed', maxMembers: 8, startDate: todayISO() })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await api.post('/groups', { ...form, maxMembers: Number(form.maxMembers) }); toast(t('groups.created')); onClose(true) }
    catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={() => onClose(false)} eyebrow={t('groups.new')} title={t('groups.createAction')}
      footer={<><button className="btn" form="group-form" disabled={busy}>{busy ? t('groups.creating') : t('groups.createAction')}</button><button className="btn btn-outline" onClick={() => onClose(false)}>{t('groups.cancel')}</button></>}>
      <form id="group-form" className="form" onSubmit={submit}>
        <label><span className="req">{t('groups.name')}</span><input value={form.name} onChange={set('name')} required maxLength={120} /></label>
        <label>{t('groups.description')}<textarea rows={2} value={form.description} onChange={set('description')} maxLength={2000} /></label>
        <div className="form-grid">
          <label>{t('groups.whoCanJoin')}<select value={form.genderType} onChange={set('genderType')}><option value="Mixed">{t('groups.mixed')}</option><option value="MenOnly">{t('groups.menOnly')}</option><option value="WomenOnly">{t('groups.womenOnly')}</option></select></label>
          <label><span className="req">{t('groups.maxMembers')}</span><input type="number" min={2} max={100} value={form.maxMembers} onChange={set('maxMembers')} required /></label>
        </div>
        <label><span className="req">{t('groups.startDate')}</span><input type="date" min={todayISO()} value={form.startDate} onChange={set('startDate')} required /></label>
        {error && <div className="notice error" role="alert">{error}</div>}
      </form>
    </Modal>
  )
}

export default function GroupsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [creating, setCreating] = useState(false)
  const groups = useFetch(async () => (await api.get('/groups', { params: { pageSize: 50 } })).data, [user?.id])
  const canCreate = user && ['Tourist', 'Agency'].includes(user.role)

  return (
    <>
      <PageHeading eyebrow={t('groups.eyebrow')} title={t('groups.title')} description={t('groups.desc')}
        action={canCreate ? <button className="btn" onClick={() => setCreating(true)}><Plus size={16} strokeWidth={1.75} />{t('groups.create')}</button> : <Link to="/login" className="btn btn-outline">{t('groups.loginToJoin')}</Link>} />
      {groups.loading && <Loading />}
      {groups.error && <ErrorBox message={groups.error} onRetry={groups.reload} />}
      {groups.data?.items.length === 0 && <div className="card"><Empty icon={Users} title={t('groups.noGroups')}>{t('groups.createFirst')}</Empty></div>}
      <div className="grid grid-2">{groups.data?.items.map((g) => <GroupCard key={g.id} group={g} user={user} onChanged={groups.reload} />)}</div>
      {creating && <CreateGroupModal onClose={(ok) => { setCreating(false); if (ok) groups.reload() }} />}
    </>
  )
}
