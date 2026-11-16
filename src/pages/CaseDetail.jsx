import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLookup, useStore } from '../store/AppStore'
import { STATUS, evidenceCode, formatDate, initials } from '../lib/format'
import { EVENT_COLOR, EVENT_LABEL } from '../lib/events'
import { BigTag } from '../components/Tags'
import { CaseSticker, StatusStamp } from '../components/Status'
import CaseModal from '../components/CaseModal'
import { keepHyphen } from '../components/Folder'
import { ChevronRight } from '../components/Icons'
import './cases.css'

const tilts = [1.5, -1.2, -1, 1]

function historyText(e, item) {
  const code = evidenceCode(e.evidenceId)
  if (e.type === 'register') return `${code} ${item.name} diregistrasi`
  if (e.type === 'transfer') return `Custody ${code} berpindah`
  if (e.type === 'analysis') return `Laporan analisis ${code} masuk`
  if (e.type === 'status') return `Status ${code} menjadi ${STATUS[e.status]?.label}`
  if (e.type === 'void') return `${code} dibatalkan (void)`
  return `${EVENT_LABEL[e.type]} ${code}`
}

export default function CaseDetail() {
  const { no } = useParams()
  const { me } = useStore()
  const { kase, evidenceIn, user, eventsOf } = useLookup()
  const [editing, setEditing] = useState(false)

  const c = kase(no)
  if (!c) return <Navigate to="/kasus" replace />

  const items = evidenceIn(no)
  const active = items.filter((i) => i.status !== 'Voided')
  const inLab = items.filter((i) => i.status === 'InAnalysis').length
  const events = items.flatMap((i) => eventsOf(i.id).map((e) => ({ ...e, item: i })))
  const last = events.reduce((m, e) => (e.at > m ? e.at : m), c.createdAt)
  const history = [...events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4)
  const creator = user(c.createdBy)
  const canEdit = ['Penyidik', 'Admin'].includes(me.role)

  return (
    <>
      <div className="page-head">
        <div>
          <div className="crumbs">
            <Link to="/kasus">Kasus</Link>
            <ChevronRight />
            <span className="current mono">{c.no}</span>
          </div>
          <div className="title-row">
            <h1>{keepHyphen(c.title)}</h1>
            <CaseSticker status={c.status} />
          </div>
        </div>
        <div className="actions">
          {canEdit && (
            <button className="btn btn-outline" onClick={() => setEditing(true)}>
              Edit kasus
            </button>
          )}
          {me.role === 'Penyidik' && (
            <Link to="/registrasi" className="btn btn-red">
              Registrasi bukti
            </Link>
          )}
        </div>
      </div>

      <div className="open-folder">
        <div className="open-folder-tab mono">{c.no}</div>
        <div className="open-folder-body">
          <div className="folder-left">
            <div className="folder-sheet">
              <svg className="paperclip" width="22" height="66" viewBox="0 0 22 66" fill="none" stroke="#9AA3A9" strokeWidth="2.6" strokeLinecap="round">
                <path d="M16 22V52C16 57.5 13.5 61 11 61C8.5 61 6 57.5 6 52V12C6 7.5 8 5 11 5C14 5 16 7.5 16 12" />
                <path d="M11 18V48" />
              </svg>
              <h2>Deskripsi kasus</h2>
              <p className="desc">{c.description || 'Belum ada deskripsi.'}</p>
              <div className="sheet-grid">
                <div>
                  <span>Jumlah bukti</span>
                  <b>{active.length}</b>
                </div>
                <div>
                  <span>Dalam analisis</span>
                  <b>{inLab}</b>
                </div>
                <div>
                  <span>Dibuat</span>
                  <b>
                    {formatDate(c.createdAt)} oleh {creator?.name ?? 'Pengguna dihapus'}
                  </b>
                </div>
                <div>
                  <span>Terakhir diperbarui</span>
                  <b>{formatDate(last)}</b>
                </div>
              </div>
            </div>

            <div className="folder-sheet second">
              <h2 style={{ fontSize: 18, marginBottom: 14 }}>Riwayat kasus</h2>
              <ul className="history">
                {history.map((e) => (
                  <li key={e.id}>
                    <span className="mono">{formatDate(e.at).replace(/ \d{4}$/, '')}</span>
                    <span className="dot" style={{ background: EVENT_COLOR[e.type] }} />
                    <span>{historyText(e, e.item)}</span>
                  </li>
                ))}
                <li>
                  <span className="mono">{formatDate(c.createdAt).replace(/ \d{4}$/, '')}</span>
                  <span className="dot" style={{ background: 'var(--ink-soft)' }} />
                  <span>Kasus dibuat oleh {creator?.name ?? 'Pengguna dihapus'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="folder-right">
            <div className="folder-right-head">
              <h2>Barang bukti</h2>
              <span>{items.length} bukti</span>
            </div>
            <div className="tag-grid">
              {items.map((item, i) => {
                const h = user(item.holder)
                return (
                  <Link key={item.id} to={`/bukti/${item.id}`} className="case-tag" style={{ '--tilt': `${tilts[i % 4]}deg`, '--hole': '#E3BA6B' }}>
                    <BigTag status={item.status} width={282} cut={28} band={42} hole={7.5}>
                      <div>
                        <span className={`mono ct-id ${item.status === 'Voided' ? 'strike' : ''}`}>{evidenceCode(item.id)}</span>
                        <h3>{item.name}</h3>
                      </div>
                      <span className="ct-who">
                        <span className={`avatar ${item.holder === me.id ? 'me' : ''}`} style={{ width: 26, height: 26, fontSize: 10 }}>
                          {h ? initials(h.name) : '?'}
                        </span>
                        {h?.name ?? 'Pengguna dihapus'}
                      </span>
                      <span className="ct-date">Didaftarkan {formatDate(item.registeredAt)}</span>
                      <span className="ct-foot">
                        <StatusStamp status={item.status} />
                        <ChevronRight size={16} />
                      </span>
                    </BigTag>
                  </Link>
                )
              })}
              {me.role === 'Penyidik' && (
                <Link to="/registrasi" className="tag-slot">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#7A5E2A" strokeWidth="1.6">
                    <circle cx="18" cy="18" r="17" />
                    <path d="M18 11V25M11 18H25" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Registrasi bukti baru
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && <CaseModal kase={c} onClose={() => setEditing(false)} />}
    </>
  )
}
