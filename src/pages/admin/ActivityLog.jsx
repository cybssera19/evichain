import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLookup, useStore } from '../../store/AppStore'
import { evidenceCode, formatBlock, formatDateTime, shortTx } from '../../lib/format'
import { EVENT_COLOR, EVENT_LABEL, eventWho } from '../../lib/events'
import { Pager } from '../../components/Ledger'
import { Search } from '../../components/Icons'
import './admin.css'

const PER_PAGE = 11

// singkatan seperti WD jangan ikut dikecilkan
const lowerFirst = (t) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t)
const TYPES = ['register', 'transfer', 'analysis', 'status', 'metadata', 'void']

export default function ActivityLog() {
  const { state } = useStore()
  const { user } = useLookup()
  const [type, setType] = useState(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const all = [...state.events].sort((a, b) => b.at.localeCompare(a.at))
  const q = query.trim().toLowerCase()
  const rows = all.filter((e) => {
    if (type && e.type !== type) return false
    if (!q) return true
    const names = [e.by, e.from, e.to].map((id) => user(id)?.name ?? '').join(' ')
    return `${evidenceCode(e.evidenceId)} ${names}`.toLowerCase().includes(q)
  })
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const current = Math.min(page, pages)
  const shown = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const pick = (t) => {
    setType(t)
    setPage(1)
  }

  return (
    <>
      <div className="page-head">
        <h1>Log aktivitas</h1>
      </div>

      <div className="toolbar">
        <label className="search" style={{ width: 340 }}>
          <Search />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Cari ID bukti atau pengguna"
          />
        </label>
        <div className="chip-row">
          <button className={`chip ${!type ? 'on' : ''}`} onClick={() => pick(null)}>
            Semua <span className="n">{all.length}</span>
          </button>
          {TYPES.map((t) => {
            const n = all.filter((e) => e.type === t).length
            return (
              <button key={t} className={`chip ${type === t ? 'on' : ''} ${n ? '' : 'zero'}`} onClick={() => pick(type === t ? null : t)}>
                {EVENT_LABEL[t]} <span className="n">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="printout">
        <div className="print-row head">
          <span>Waktu</span>
          <span>Bukti</span>
          <span>Aksi</span>
          <span>Detail</span>
          <span>Blok</span>
          <span>Tx</span>
        </div>
        {shown.map((e) => (
          <div key={e.id} className="print-row body">
            <span className="mono">{formatDateTime(e.at)}</span>
            <Link to={`/bukti/${e.evidenceId}`} className="mono" style={{ fontWeight: 500 }}>
              {evidenceCode(e.evidenceId)}
            </Link>
            <span className="act">
              <i style={{ background: EVENT_COLOR[e.type] }} />
              {EVENT_LABEL[e.type]}
            </span>
            <span className="detail">
              {eventWho(e, user)}
              {e.note ? `, ${lowerFirst(e.note)}` : ''}
            </span>
            <span className="mono faint">{formatBlock(e.block)}</span>
            <span className="mono faint">{shortTx(e.tx)}</span>
          </div>
        ))}
        {!shown.length && <p className="print-foot">Tidak ada kejadian yang cocok.</p>}
        <div className="print-foot">
          <span>
            Menampilkan {shown.length} dari {rows.length} kejadian
          </span>
          <Pager page={current} pages={pages} onChange={setPage} />
        </div>
      </div>
      <div className="printout-edge" />
    </>
  )
}
