import { useState, useMemo } from 'react'
import { evidenceCode, shortTx } from '../lib/format'
import './activitylog.css'

const ACTION_HEX = {
  'Registration': '#2d5be3',
  'Custody transfer': '#c98a0a',
  'Analysis result': '#e8a317',
  'Status change': '#1f9d63',
  'Metadata update': '#6b6455',
  'Custody recovery': '#1f9d63',
  'Void': '#e8452c',
}

const FILTERS = [
  'Registration',
  'Custody transfer',
  'Analysis result',
  'Status change',
  'Metadata update',
  'Void',
]

const PER_PAGE = 12

function fmt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function ActivityLog({ events, onOpenEvidence }) {
  const [action, setAction] = useState(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const counts = useMemo(() => {
    const c = {}
    events.forEach((e) => { c[e.action] = (c[e.action] || 0) + 1 })
    return c
  }, [events])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...events]
      .sort((a, b) => b.at - a.at)
      .filter((r) => {
        if (action && r.action !== action) return false
        if (!q) return true
        return [evidenceCode(r.evidenceId), r.actor, r.detail, r.action]
          .some((v) => (v || '').toLowerCase().includes(q))
      })
  }, [events, action, query])

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const current = Math.min(page, pages)
  const slice = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const pick = (f) => { setAction((p) => (p === f ? null : f)); setPage(1) }

  return (
    <div className="actlog">
      <header className="actlog-head">
        <h1>Activity log</h1>
        <span className="actlog-total">{events.length} events on-chain</span>
      </header>

      <div className="actlog-toolbar">
        <span className="actlog-search">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9.6 9.6L12.2 12.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search evidence ID or user"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          />
        </span>

        <div className="actlog-tabs">
          <button className={!action ? 'actlog-tab is-on' : 'actlog-tab'} onClick={() => { setAction(null); setPage(1) }}>
            All <b>{events.length}</b>
          </button>
          {FILTERS.filter((f) => counts[f]).map((f) => (
            <button
              key={f}
              className={action === f ? 'actlog-tab is-on' : 'actlog-tab'}
              onClick={() => pick(f)}
            >
              <i className="actlog-dot" style={{ background: ACTION_HEX[f] }} />
              {f} <b>{counts[f]}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="actlog-table-wrap">
        <table className="actlog-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Evidence</th>
              <th>Action</th>
              <th>Detail</th>
              <th>Block</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r, i) => {
              const hex = ACTION_HEX[r.action] ?? '#9aa0a6'
              return (
                <tr key={i} onClick={() => onOpenEvidence(r.evidenceId)}>
                  <td className="actlog-time">{fmt(r.at)}</td>
                  <td className="actlog-id actlog-mono">{evidenceCode(r.evidenceId)}</td>
                  <td>
                    <span className="actlog-action">
                      <i className="actlog-dot" style={{ background: hex }} />
                      <b style={{ color: hex }}>{r.action}</b>
                    </span>
                  </td>
                  <td className="actlog-detail">{r.detail}</td>
                  <td className="actlog-block actlog-mono">
                    {r.block ? Number(r.block).toLocaleString('en-US') : '—'}
                  </td>
                  <td className="actlog-tx actlog-mono">{r.txHash ? shortTx(r.txHash) : '—'}</td>
                </tr>
              )
            })}
            {!slice.length && (
              <tr className="actlog-empty-row">
                <td colSpan={6}>No events recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="actlog-pager">
          <span className="actlog-range">
            Showing {(current - 1) * PER_PAGE + 1}–{Math.min(current * PER_PAGE, rows.length)} of {rows.length} events
          </span>
          <div className="actlog-pages">
            <button className="actlog-page" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                className={current === i + 1 ? 'actlog-page is-on' : 'actlog-page'}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="actlog-page" disabled={current === pages} onClick={() => setPage(current + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
