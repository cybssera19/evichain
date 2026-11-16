import { Link } from 'react-router-dom'
import { useLookup, useStore } from '../../store/AppStore'
import { CASE_COLOR, STATUS, evidenceCode, formatBlock, formatShort, formatToday } from '../../lib/format'
import { EVENT_LABEL, eventWho } from '../../lib/events'
import IdCard from '../../components/IdCard'
import { keepHyphen } from '../../components/Folder'
import Ledger from '../../components/Ledger'
import { StatusStamp } from '../../components/Status'
import { TapeV } from '../../components/Tape'
import './admin.css'

const tilts = [1.5, -1, 2, -1.8, 1, -1.2, 0.8, -0.6]

export default function AdminDashboard() {
  const { state, me } = useStore()
  const { user, evidenceIn, recent } = useLookup()

  const roles = new Set(state.users.map((u) => u.role)).size
  const latest = [...state.evidence].sort((a, b) => b.id - a.id).slice(0, 4)
  const active = state.evidence.filter((e) => e.status !== 'Voided')
  const count = (s) => state.evidence.filter((e) => e.status === s).length
  const running = state.cases.filter((c) => c.status !== 'Selesai' && evidenceIn(c.no).length).slice(0, 3)

  const bar = ['Collected', 'Stored', 'InAnalysis'].map((s) => ({ s, n: count(s) }))
  const total = bar.reduce((t, b) => t + b.n, 0) || 1

  return (
    <>
      <div className="page-head">
        <div>
          <p className="date">{formatToday()}</p>
          <h1>Halo, {me.name.split(' ')[0]}</h1>
        </div>
        <div className="actions">
          <Link to="/log" className="btn btn-outline">
            Log aktivitas
          </Link>
          <Link to="/pengguna" state={{ add: true }} className="btn btn-red">
            Tambah pengguna
          </Link>
        </div>
      </div>

      <div className="section-title">
        <h2>
          Pengguna terdaftar
          <span className="count">
            {state.users.length} orang, {roles} role
          </span>
        </h2>
        <Link to="/pengguna" className="side">
          Kelola pengguna
        </Link>
      </div>

      <div className="badge-rail">
        <span className="rail" />
        <div className="badge-row">
          {state.users.slice(0, 6).map((u, i) => (
            <Link key={u.id} to="/pengguna" className="badge-link">
              <IdCard user={u} tilt={tilts[i]} />
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-lower">
        <div className="admin-left">
          <div className="section-title">
            <h2>Bukti terbaru</h2>
            <div className="mini-sum">
              <b>{active.length} aktif</b>
              <span className="sum-bar">
                {bar.map(({ s, n }) => (
                  <i key={s} style={{ flex: n / total, background: STATUS[s].color }} />
                ))}
              </span>
              <span>
                {count('Collected')} collected, {count('Stored')} stored, {count('InAnalysis')} dalam analisis, {count('Voided')} void
              </span>
            </div>
          </div>
          <Ledger
            compact
            rows={latest}
            rowKey={(e) => e.id}
            columns={[
              { key: 'id', label: 'ID', width: '110px', render: (e) => <span className={`mono ${e.status === 'Voided' ? 'strike' : ''}`} style={{ fontWeight: 500 }}>{evidenceCode(e.id)}</span> },
              { key: 'name', label: 'Barang bukti', width: '1.5fr', render: (e) => <b className={e.status === 'Voided' ? 'strike' : ''} style={{ fontWeight: 600 }}>{e.name}</b> },
              { key: 'holder', label: 'Pemegang', width: '1fr', render: (e) => <span style={{ fontWeight: 500 }}>{user(e.holder)?.name ?? 'Pengguna dihapus'}</span> },
              { key: 'status', label: 'Status', width: '150px', render: (e) => <StatusStamp status={e.status} /> },
            ]}
          />

          <div className="section-title" style={{ marginTop: 28 }}>
            <h2>
              Kasus berjalan<span className="count">{running.length} kasus</span>
            </h2>
          </div>
          <div className="folder-strip">
            {running.map((c) => (
              <Link key={c.no} to={`/kasus/${c.no}`} className="mini-folder">
                <span className="mini-folder-tab" />
                <div className="mini-folder-body">
                  <div>
                    <span className="mono">{c.no}</span>
                    <h3>{keepHyphen(c.title)}</h3>
                  </div>
                  <div className="mini-folder-foot">
                    <b>{evidenceIn(c.no).length} bukti</b>
                    <span>
                      <span className="dot" style={{ background: CASE_COLOR[c.status], width: 6, height: 6 }} />
                      {c.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-right">
          <div className="section-title">
            <h2>Rantai terbaru</h2>
            <Link to="/log" className="side">
              Buka log
            </Link>
          </div>
          <TapeV
            highlightFirst
            entries={recent(4).map((e, i) => (
              <div key={e.id}>
                <div className="entry-head">
                  <span className="entry-title">
                    {i === 0 && <span className="pin" />}
                    <b style={{ fontSize: 15 }}>{EVENT_LABEL[e.type]}</b>
                    <span className="mono">{evidenceCode(e.evidenceId)}</span>
                  </span>
                  <span className="entry-time">{formatShort(e.at)}</span>
                </div>
                <p className="entry-note">{eventWho(e, user)}</p>
                <p className="entry-meta">blok {formatBlock(e.block)}</p>
              </div>
            ))}
          />
        </div>
      </div>
    </>
  )
}
