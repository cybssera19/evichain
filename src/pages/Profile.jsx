import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/AppStore'
import { CONTRACT } from '../lib/chain'
import { ROLE_COLOR, STATUS, formatDateTime, initials } from '../lib/format'
import { Barcode } from '../components/Tags'
import HashBox from '../components/HashBox'
import { Database, Lock, Logout } from '../components/Icons'
import './profile.css'

const SESSION_MINUTES = 60

function TallyTag({ color }) {
  return (
    <svg width="14" height="20" viewBox="0 0 20 28">
      <path d="M5 0.5H15L19.5 5V26C19.5 26.8 18.8 27.5 18 27.5H2C1.2 27.5 0.5 26.8 0.5 26V5Z" fill="#FFFDF7" stroke="#CFC8B6" />
      <path d="M5 0.5H15L19.5 5V8H0.5V5Z" fill={color} />
    </svg>
  )
}

const ChainTally = () => (
  <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="#7A5E2A" strokeWidth="1.6">
    <rect x="1" y="2" width="12" height="10" rx="5" />
    <rect x="9" y="2" width="12" height="10" rx="5" />
  </svg>
)

export default function Profile() {
  const { state, me, actions } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: me.name, nip: me.nip, unit: me.unit, email: me.email })
  const [saved, setSaved] = useState(false)

  const registered = state.evidence.filter((e) => e.registeredBy === me.id)
  const transfers = state.events.filter((e) => e.type === 'transfer' && e.from === me.id)
  const holding = state.evidence.filter((e) => e.holder === me.id && e.status !== 'Voided')

  const expires = new Date(new Date(state.loginAt).getTime() + SESSION_MINUTES * 60000).toISOString()
  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    setSaved(false)
  }

  const save = (e) => {
    e.preventDefault()
    actions.saveUser({ ...me, ...form })
    setSaved(true)
  }

  const logout = () => {
    actions.logout()
    navigate('/masuk')
  }

  return (
    <>
      <div className="page-head">
        <h1>Profil</h1>
      </div>

      <div className="profile-grid">
        <div className="badge-col">
          <svg className="lanyard" width="120" height="200" viewBox="0 0 120 200">
            <path d="M-10 0L52 182" stroke={ROLE_COLOR[me.role]} strokeOpacity="0.7" strokeWidth="16" />
            <path d="M130 0L68 182" stroke={ROLE_COLOR[me.role]} strokeWidth="16" />
          </svg>
          <svg className="lanyard-clip" width="56" height="44" viewBox="0 0 56 44">
            <defs>
              <linearGradient id="lclip" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#9AA3A9" />
                <stop offset="0.5" stopColor="#E4E8EA" />
                <stop offset="1" stopColor="#8E979D" />
              </linearGradient>
            </defs>
            <rect x="8" y="0" width="40" height="22" rx="6" fill="url(#lclip)" />
            <rect x="22" y="20" width="12" height="24" rx="3" fill="#B9C0C5" />
          </svg>
          <div className="badge">
            <div className="badge-band" style={{ background: ROLE_COLOR[me.role] }}>
              <span>{me.role}</span>
              <i />
            </div>
            <div className="badge-body">
              <div className="badge-id">
                <div className="badge-photo">{initials(me.name)}</div>
                <div>
                  <h2>{me.name}</h2>
                  <span className="muted">{me.unit}</span>
                </div>
              </div>
              <hr className="perforation" style={{ margin: 0 }} />
              <div className="field">
                <span className="label muted" style={{ fontWeight: 500, fontSize: 12 }}>
                  Alamat wallet
                </span>
                <HashBox value={me.wallet} />
                <span className="hint" style={{ alignItems: 'flex-start' }}>
                  <Lock /> Role dibaca dari smart contract dan hanya bisa diubah Admin
                </span>
              </div>
              <Barcode seed={me.nip.length + me.name.length} width={344} height={40} />
            </div>
          </div>
        </div>

        <form className="paper profile-form" onSubmit={save}>
          <h2>Data diri</h2>
          <div className="field">
            <label>
              Nama lengkap<span className="req">*</span>
            </label>
            <input className="input" required value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label>NIP</label>
            <input className="input mono" value={form.nip} onChange={set('nip')} />
          </div>
          <div className="field">
            <label>Unit kerja</label>
            <input className="input" value={form.unit} onChange={set('unit')} />
          </div>
          <div className="field">
            <label>
              Email<span className="req">*</span>
            </label>
            <input className="input" type="email" required value={form.email} onChange={set('email')} />
          </div>
          <div className="clip-foot" style={{ justifyContent: 'space-between' }}>
            <span className="hint">
              <Database /> {saved ? 'Tersimpan' : 'Tanpa transaksi blockchain'}
            </span>
            <button className="btn btn-green">Simpan profil</button>
          </div>
        </form>

        <div className="profile-side">
          <div className="ticket">
            <div className="ticket-head">
              <h2>Sesi login</h2>
              <span className="live">
                <span className="dot" style={{ background: 'var(--green)', width: 6, height: 6 }} />
                Aktif
              </span>
            </div>
            <dl className="ticket-rows">
              <div>
                <dt>Metode</dt>
                <dd>Sign-In with Ethereum</dd>
              </div>
              <div>
                <dt>Jaringan</dt>
                <dd className="mono">
                  {CONTRACT.network}  {CONTRACT.chainId}
                </dd>
              </div>
              <div>
                <dt>Masuk sejak</dt>
                <dd>{formatDateTime(state.loginAt)}</dd>
              </div>
              <div>
                <dt>Berlaku hingga</dt>
                <dd>{formatDateTime(expires)}</dd>
              </div>
            </dl>
            <div className="ticket-cut" />
            <button className="btn logout" onClick={logout}>
              <Logout /> Keluar
            </button>
          </div>

          <div className="paper paper-pad tallies">
            <h2>Aktivitas Anda</h2>
            <div className="tally">
              <div>
                <span>Bukti didaftarkan</span>
                <div className="tally-icons">
                  {registered.map((e) => (
                    <TallyTag key={e.id} color={STATUS[e.status].color} />
                  ))}
                </div>
              </div>
              <b className="mono">{registered.length}</b>
            </div>
            <div className="tally">
              <div>
                <span>Transfer custody</span>
                <div className="tally-icons">
                  {transfers.map((e) => (
                    <ChainTally key={e.id} />
                  ))}
                </div>
              </div>
              <b className="mono">{transfers.length}</b>
            </div>
            <div className="tally">
              <div>
                <span>Dipegang saat ini</span>
                <div className="tally-icons">
                  {holding.map((e) => (
                    <TallyTag key={e.id} color={STATUS[e.status].color} />
                  ))}
                </div>
              </div>
              <b className="mono">{holding.length}</b>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
