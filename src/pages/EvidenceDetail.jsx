import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLookup, useStore } from '../store/AppStore'
import {
  FINAL_STATUS,
  STATUS,
  evidenceCode,
  formatBlock,
  formatDateTime,
  formatShort,
  formatSize,
  initials,
  shortHash,
  shortTx,
} from '../lib/format'
import { EVENT_LABEL, eventWho } from '../lib/events'
import { sha256File } from '../lib/hash'
import { BigTag, Barcode } from '../components/Tags'
import { RoleChip, StatusStamp, StatusSticker } from '../components/Status'
import { TapeV } from '../components/Tape'
import Bag from '../components/Bag'
import HashBox from '../components/HashBox'
import ClipboardModal, { ClipFoot } from '../components/Clipboard'
import { ChevronRight, FileIcon, Info, Lock, Upload } from '../components/Icons'
import './detail.css'

function TransferModal({ item, onClose }) {
  const { state, me, actions, requestTx, notify } = useStore()
  const candidates = state.users.filter((u) => u.id !== me.id && ['Penyidik', 'Analis'].includes(u.role))
  const [to, setTo] = useState(candidates.find((u) => u.role === 'Analis')?.id ?? candidates[0]?.id)
  const [note, setNote] = useState('')
  const target = state.users.find((u) => u.id === to)

  const submit = async (e) => {
    e.preventDefault()
    onClose()
    const ok = await requestTx({ fn: 'transferCustody()', params: `${evidenceCode(item.id)} ke ${target.name}` })
    if (!ok) return
    const ev = actions.transfer(item.id, to, note.trim())
    notify({ title: `Tercatat di blok ${formatBlock(ev.block)}`, body: `Custody ${evidenceCode(item.id)} berpindah ke ${target.name}`, tx: ev.tx })
  }

  return (
    <ClipboardModal open onClose={onClose} title="Transfer custody" sub={`${evidenceCode(item.id)} ${item.name}`}>
      <form className="modal-form" onSubmit={submit}>
        <div className="handoff">
          <Person user={me} />
          <svg className="handoff-mid" viewBox="0 0 96 34" preserveAspectRatio="xMidYMid meet">
            <path d="M2 17H86" stroke="#8C846F" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M82 11L90 17L82 23" stroke="#8C846F" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <g transform="translate(36 2)">
              <path d="M5 0.5H17L21.5 5V29C21.5 29.8 20.8 30.5 20 30.5H2C1.2 30.5 0.5 29.8 0.5 29V5Z" fill="#FFFDF7" stroke="#CFC8B6" />
              <path d="M5 0.5H17L21.5 5V9H0.5V5Z" fill={STATUS[item.status].color} />
            </g>
          </svg>
          {target && <Person user={target} />}
        </div>
        <div className="field">
          <label>
            Penerima<span className="req">*</span>
          </label>
          <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}, {u.role}, {u.unit}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>
            Catatan transfer<span className="req">*</span>
          </label>
          <textarea className="input" required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tujuan penyerahan barang bukti" />
        </div>
        <div className="note warn">
          <Info color="var(--amber-ink)" />
          <span>
            {target?.role === 'Analis'
              ? 'Status bukti berubah menjadi Dalam analisis. Transfer tercatat permanen dan tidak bisa dibatalkan.'
              : 'Transfer tercatat permanen dan tidak bisa dibatalkan.'}
          </span>
        </div>
        <ClipFoot>
          <button type="button" className="btn btn-text btn-lg" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-green btn-lg" disabled={!target}>
            Lanjut ke MetaMask
          </button>
        </ClipFoot>
      </form>
    </ClipboardModal>
  )
}

function Person({ user }) {
  return (
    <div className="person">
      <span className="avatar me" style={{ width: 40, height: 40, fontSize: 14, background: user.role === 'Analis' ? '#E3DCCB' : '#E6C27A' }}>
        {initials(user.name)}
      </span>
      <div>
        <b>{user.name}</b>
        <span>{user.role}</span>
      </div>
    </div>
  )
}

const FLOW = ['Collected', 'InAnalysis', 'Stored']

function StatusModal({ item, onClose }) {
  const { me, actions, requestTx, notify } = useStore()
  const options = ['Stored', 'Released', 'Disposed', ...(me.role === 'Admin' ? ['Voided'] : [])].filter((s) => s !== item.status)
  const [status, setStatus] = useState(options.includes('Released') ? 'Released' : options[0])
  const [reason, setReason] = useState('')
  const final = FINAL_STATUS.includes(status)

  const submit = async (e) => {
    e.preventDefault()
    onClose()
    const fn = status === 'Voided' ? 'voidEvidence()' : 'updateStatus()'
    const ok = await requestTx({ fn, params: `${evidenceCode(item.id)} menjadi ${STATUS[status].label}` })
    if (!ok) return
    const ev = actions.changeStatus(item.id, status, reason.trim())
    notify({ title: `Tercatat di blok ${formatBlock(ev.block)}`, body: `Status ${evidenceCode(item.id)} menjadi ${STATUS[status].label}`, tx: ev.tx })
  }

  const trail = [...FLOW, status].filter((s, i, a) => a.indexOf(s) === i)

  return (
    <ClipboardModal open onClose={onClose} title="Ubah status" sub={`${evidenceCode(item.id)} ${item.name}`}>
      <form className="modal-form" onSubmit={submit}>
        <div className="status-track">
          {trail.map((s, i) => {
            const now = s === item.status
            const next = s === status
            const done = !now && !next && trail.indexOf(item.status) > i
            return (
              <div key={s} className="track-step">
                <span className={`track-dot ${now ? 'now' : next ? 'next' : done ? 'done' : ''}`} style={{ '--c': STATUS[s].color }}>
                  {next ? <ChevronRight size={12} /> : <i />}
                </span>
                <span className={now || next ? 'on' : ''}>{STATUS[s].label}</span>
              </div>
            )
          })}
        </div>
        <div className="field">
          <label>
            Status baru<span className="req">*</span>
          </label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {options.map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
                {s === 'Released' ? ', dikembalikan ke pemilik' : s === 'Disposed' ? ', dimusnahkan' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>
            Alasan<span className="req">*</span>
          </label>
          <textarea className="input" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Dasar perubahan status" />
        </div>
        {final && (
          <div className="note danger">
            <Info color="var(--red)" />
            <span>{STATUS[status].label} adalah status akhir. Setelah itu bukti tidak bisa ditransfer lagi.</span>
          </div>
        )}
        <ClipFoot>
          <button type="button" className="btn btn-text btn-lg" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-green btn-lg">Lanjut ke MetaMask</button>
        </ClipFoot>
      </form>
    </ClipboardModal>
  )
}

function MetadataModal({ item, onClose }) {
  const { actions, requestTx, notify } = useStore()
  const [name, setName] = useState(item.name)
  const [note, setNote] = useState(item.note)

  const submit = async (e) => {
    e.preventDefault()
    onClose()
    const ok = await requestTx({ fn: 'updateMetadata()', params: evidenceCode(item.id) })
    if (!ok) return
    const ev = actions.editMetadata(item.id, { name: name.trim(), note: note.trim() })
    notify({ title: `Tercatat di blok ${formatBlock(ev.block)}`, body: `Metadata ${evidenceCode(item.id)} diperbarui`, tx: ev.tx })
  }

  return (
    <ClipboardModal open onClose={onClose} title="Edit metadata" sub={`${evidenceCode(item.id)}  ${item.caseNo}`}>
      <form className="modal-form" onSubmit={submit}>
        <div className="field">
          <label>
            Jenis barang bukti<span className="req">*</span>
          </label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Catatan</label>
          <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="field">
          <label>Hash SHA-256</label>
          <div className="input locked mono" style={{ display: 'flex', gap: 10, fontSize: 12, wordBreak: 'break-all' }}>
            <span style={{ flex: 1 }}>{item.hash}</span>
            <Lock />
          </div>
          <span className="hint">Hash tidak bisa diubah setelah registrasi</span>
        </div>
        <ClipFoot>
          <button type="button" className="btn btn-text btn-lg" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-green btn-lg">Lanjut ke MetaMask</button>
        </ClipFoot>
      </form>
    </ClipboardModal>
  )
}

function QuickCheck({ item }) {
  const { actions } = useStore()
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const check = async (file) => {
    setBusy(true)
    const hash = await sha256File(file)
    const match = hash === item.hash
    actions.addVerification(item.id, match)
    setResult({ match, name: file.name })
    setBusy(false)
  }

  return (
    <Bag onFile={check}>
      {busy ? (
        <p>Menghitung hash…</p>
      ) : result ? (
        <>
          <h3 style={{ color: result.match ? 'var(--green)' : 'var(--red)' }}>{result.match ? 'Hash cocok' : 'Hash tidak cocok'}</h3>
          <p className="mono" style={{ fontSize: 12 }}>
            {result.name}
          </p>
          <p>Klik atau seret file lain untuk cek ulang</p>
        </>
      ) : (
        <>
          <div className="bag-icon">
            <Upload />
          </div>
          <h3>Cek integritas cepat</h3>
          <p>Seret file ke sini atau pilih file</p>
        </>
      )}
    </Bag>
  )
}

export default function EvidenceDetail() {
  const { id } = useParams()
  const { me } = useStore()
  const { item: find, kase, user, eventsOf } = useLookup()
  const [modal, setModal] = useState(null)

  const item = find(id)
  if (!item) return <Navigate to="/bukti" replace />

  const c = kase(item.caseNo)
  const holder = user(item.holder)
  const events = eventsOf(item.id).sort((a, b) => a.at.localeCompare(b.at))
  const reports = events.filter((e) => e.type === 'analysis')
  const registrar = user(item.registeredBy)
  const final = FINAL_STATUS.includes(item.status)
  const mine = item.holder === me.id
  const gaveAway = !mine && events.some((e) => e.type === 'transfer' && e.from === me.id)
  const canEdit = !final && (mine || me.role === 'Admin')

  return (
    <>
      <div className="page-head detail-head">
        <div>
          <div className="crumbs">
            <Link to="/bukti">Barang bukti</Link>
            <ChevronRight />
            <span className="current mono">{evidenceCode(item.id)}</span>
          </div>
          <div className="title-row">
            <h1>{item.name}</h1>
            <StatusSticker status={item.status} />
          </div>
        </div>
        <div className="actions">
          <Link to={`/verifikasi?bukti=${item.id}`} className="btn btn-outline">
            Verifikasi file
          </Link>
          {canEdit && me.role !== 'Auditor' && (
            <>
              <button className="btn btn-outline" onClick={() => setModal('meta')}>
                Edit metadata
              </button>
              <button className="btn btn-outline" onClick={() => setModal('status')}>
                Ubah status
              </button>
            </>
          )}
          {mine && !final && (
            <button className="btn btn-red" onClick={() => setModal('transfer')}>
              Transfer custody
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-tag-col">
          <svg className="tag-string" width="40" height="44" viewBox="0 0 40 44">
            <path d="M20 43C14 30 30 22 24 12C20 5 26 1 32 0" stroke="#D9C9A0" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <BigTag status={item.status} width={420}>
            <span className="tag-stamp">
              <StatusStamp status={item.status} size="lg" />
            </span>
            <div className="tag-id">
              <span className={`mono ${item.status === 'Voided' ? 'strike' : ''}`}>{evidenceCode(item.id)}</span>
              <h2>{item.name}</h2>
            </div>
            <dl className="tag-fields">
              <div>
                <dt>Kasus</dt>
                <dd>
                  <Link to={`/kasus/${item.caseNo}`} className="mono strong">
                    {item.caseNo}
                  </Link>
                  <span className="muted">{c?.title}</span>
                </dd>
              </div>
              <div>
                <dt>Pemegang saat ini</dt>
                <dd>
                  <span className="holder">
                    <span className={`avatar ${mine ? 'me' : ''}`} style={{ width: 30, height: 30 }}>
                      {holder ? initials(holder.name) : '?'}
                    </span>
                    <b>{holder?.name ?? 'Pengguna dihapus'}</b>
                    {holder && <RoleChip role={holder.role} />}
                  </span>
                  {gaveAway && <span className="gave-away">Anda tidak lagi memegang bukti ini</span>}
                </dd>
              </div>
              <div>
                <dt>Didaftarkan</dt>
                <dd>
                  <b>{formatDateTime(item.registeredAt)}</b>
                  <span className="muted">oleh {registrar?.name ?? 'Pengguna dihapus'}</span>
                </dd>
              </div>
              {item.note && (
                <div>
                  <dt>Catatan</dt>
                  <dd>
                    <b>{item.note}</b>
                  </dd>
                </div>
              )}
            </dl>
            <hr className="perforation" />
            <Barcode seed={item.id} width={356} height={46} muted={item.status === 'Voided'} />
            <div className="tag-foot mono">
              <span>sha256 {shortHash(item.hash)}</span>
              <span>{item.caseNo}</span>
            </div>
          </BigTag>
        </div>

        <div className="detail-mid">
          <section className="paper paper-pad">
            <h2>Integritas file</h2>
            <div className="file-row">
              <FileIcon label={item.file.name.split('.').pop().toUpperCase().slice(0, 3)} />
              <div>
                <b className="mono">{item.file.name}</b>
                <span className="muted">{formatSize(item.file.size)}, disimpan di server privat</span>
              </div>
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <span className="label muted" style={{ fontWeight: 500, fontSize: 12 }}>
                Hash SHA-256 on-chain
              </span>
              <HashBox value={item.hash} />
            </div>
            <p className="locked-line">
              <Lock /> Dikunci sejak registrasi
            </p>
          </section>

          <section className="paper paper-pad">
            <h2>
              Laporan analisis <span className="count-inline">{reports.length} laporan</span>
            </h2>
            {reports.length ? (
              reports.map((r) => (
                <div key={r.id} className="report">
                  <div className="report-row">
                    <span className="flask">
                      <svg width="20" height="20" viewBox="10 9 18 21" fill="none" stroke="#B57A05" strokeWidth="1.7" strokeLinejoin="round">
                        <path d="M15.5 10H22.5M17 10V17L12 26C11.3 27.3 12.2 29 13.7 29H24.3C25.8 29 26.7 27.3 26 26L21 17V10" />
                        <path d="M14 23H24" />
                      </svg>
                    </span>
                    <div>
                      <b>{r.note}</b>
                      <span className="muted">
                        {user(r.by)?.name}, {user(r.by)?.role}, {formatShort(r.at)}
                      </span>
                    </div>
                  </div>
                  <HashBox value={r.report.hash} />
                </div>
              ))
            ) : (
              <p className="muted">Belum ada laporan dari lab.</p>
            )}
          </section>

          <QuickCheck item={item} />
        </div>

        <div className="detail-side">
          <div className="section-title">
            <h2>
              Jejak custody<span className="count">{events.length} kejadian</span>
            </h2>
          </div>
          <TapeV
            highlightLast
            entries={events.map((e, i) => (
              <div key={e.id}>
                <div className="entry-head">
                  <span className="entry-title">
                    {i === events.length - 1 && <span className="pin" />}
                    <b>{EVENT_LABEL[e.type]}</b>
                  </span>
                  <span className="entry-time">{formatShort(e.at)}</span>
                </div>
                <p className="entry-who">{eventWho(e, user)}</p>
                {e.note && <p className="entry-note">{e.note}</p>}
                <p className="entry-meta">
                  blok {formatBlock(e.block)}   tx {shortTx(e.tx)}
                </p>
              </div>
            ))}
          />
        </div>
      </div>

      {modal === 'transfer' && <TransferModal item={item} onClose={() => setModal(null)} />}
      {modal === 'status' && <StatusModal item={item} onClose={() => setModal(null)} />}
      {modal === 'meta' && <MetadataModal item={item} onClose={() => setModal(null)} />}
    </>
  )
}
