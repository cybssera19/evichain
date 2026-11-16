import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLookup, useStore } from '../store/AppStore'
import Folder from '../components/Folder'
import CaseModal from '../components/CaseModal'
import { Search } from '../components/Icons'
import '../components/folder.css'
import './cases.css'

const STATUSES = ['Penyidikan', 'Pemberkasan', 'Selesai']

export default function Cases() {
  const { state, me } = useStore()
  const { evidenceIn } = useLookup()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(null)
  const [adding, setAdding] = useState(!!location.state?.add)

  const canAdd = ['Penyidik', 'Admin'].includes(me.role)
  const q = query.trim().toLowerCase()
  const list = state.cases.filter(
    (c) => (!filter || c.status === filter) && (!q || `${c.no} ${c.title}`.toLowerCase().includes(q)),
  )

  return (
    <>
      <div className="page-head">
        <h1>Kasus</h1>
        {canAdd && (
          <button className="btn btn-red" onClick={() => setAdding(true)}>
            Tambah kasus
          </button>
        )}
      </div>

      <div className="toolbar">
        <label className="search">
          <Search />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nomor atau judul kasus" />
        </label>
        <div className="chip-row">
          <button className={`chip ${!filter ? 'on' : ''}`} onClick={() => setFilter(null)}>
            Semua <span className="n">{state.cases.length}</span>
          </button>
          {STATUSES.map((s) => {
            const n = state.cases.filter((c) => c.status === s).length
            return (
              <button key={s} className={`chip ${filter === s ? 'on' : ''} ${n ? '' : 'zero'}`} onClick={() => setFilter(filter === s ? null : s)}>
                {s} <span className="n">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="drawer cases-drawer">
        {list.map((c) => (
          <Folder key={c.no} kase={c} items={evidenceIn(c.no)} meId={me.id} variant="cases" />
        ))}
        {!list.length && <p className="empty-desk">Tidak ada kasus yang cocok.</p>}
      </div>

      {adding && (
        <CaseModal
          onClose={() => {
            setAdding(false)
            navigate('.', { replace: true, state: null })
          }}
        />
      )}
    </>
  )
}
