import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLookup, useStore } from '../store/AppStore'
import { STATUS, evidenceCode, formatDate, initials } from '../lib/format'
import Ledger from '../components/Ledger'
import { RowTag } from '../components/Tags'
import { StatusStamp } from '../components/Status'
import { Search } from '../components/Icons'

const FILTERS = ['Collected', 'InAnalysis', 'Stored', 'Released', 'Disposed', 'Voided']

export default function EvidenceList() {
  const { state, me } = useStore()
  const { user } = useLookup()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(null)

  const items = [...state.evidence].sort((a, b) => b.id - a.id)
  const q = query.trim().toLowerCase()
  const rows = items.filter((e) => {
    if (filter && e.status !== filter) return false
    if (!q) return true
    return [evidenceCode(e.id), e.name, e.caseNo, user(e.holder)?.name ?? ''].join(' ').toLowerCase().includes(q)
  })

  const columns = [
    {
      key: 'id',
      label: 'Label',
      width: '128px',
      render: (e) => (
        <>
          <RowTag status={e.status} />
          <span className={`mono ${e.status === 'Voided' ? 'strike' : ''}`} style={{ fontWeight: 500 }}>
            {evidenceCode(e.id)}
          </span>
        </>
      ),
    },
    {
      key: 'name',
      label: 'Barang bukti',
      width: '1.6fr',
      render: (e) => <b className={e.status === 'Voided' ? 'strike' : ''} style={{ fontWeight: 600 }}>{e.name}</b>,
    },
    { key: 'case', label: 'Kasus', width: '1fr', render: (e) => <span className="mono muted">{e.caseNo}</span> },
    {
      key: 'holder',
      label: 'Pemegang',
      width: '1.2fr',
      render: (e) => {
        const h = user(e.holder)
        return (
          <>
            <span className={`avatar ${e.holder === me.id ? 'me' : ''}`}>{h ? initials(h.name) : '?'}</span>
            <span style={{ fontWeight: 500 }}>{h?.name ?? 'Pengguna dihapus'}</span>
          </>
        )
      },
    },
    { key: 'date', label: 'Didaftarkan', width: '0.8fr', render: (e) => <span className="muted">{formatDate(e.registeredAt)}</span> },
    { key: 'status', label: 'Status', width: '0.9fr', render: (e) => <StatusStamp status={e.status} /> },
  ]

  return (
    <>
      <div className="page-head">
        <h1>Barang bukti</h1>
        {me.role === 'Penyidik' && (
          <Link to="/registrasi" className="btn btn-red">
            Registrasi bukti
          </Link>
        )}
      </div>

      <div className="toolbar">
        <label className="search">
          <Search />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari ID, barang, kasus, atau pemegang" />
        </label>
        <div className="chip-row">
          <button className={`chip ${!filter ? 'on' : ''}`} onClick={() => setFilter(null)}>
            Semua <span className="n">{items.length}</span>
          </button>
          {FILTERS.map((s) => {
            const n = items.filter((e) => e.status === s).length
            return (
              <button key={s} className={`chip ${filter === s ? 'on' : ''} ${n ? '' : 'zero'}`} onClick={() => setFilter(filter === s ? null : s)}>
                {STATUS[s].label} <span className="n">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Ledger
        columns={columns}
        rows={rows}
        rowKey={(e) => e.id}
        highlight={location.state?.newId}
        onRowClick={(e) => navigate(`/bukti/${e.id}`)}
        footer={<span>Menampilkan {rows.length} dari {items.length} bukti</span>}
      />
    </>
  )
}
