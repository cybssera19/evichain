import { STATUS, CASE_COLOR, evidenceCode, initials } from '../lib/format'
import './admindash.css'

const ROLE_HEX = {
  Admin: '#e8452c',
  Investigator: '#2d5be3',
  Analyst: '#e8a317',
  Auditor: '#1f9d63',
}
const STAMP_HEX = {
  Collected: '#2d5be3',
  InAnalysis: '#c98a0a',
  Stored: '#1f9d63',
  Released: '#0f4a3c',
  Disposed: '#9aa0a6',
  Voided: '#9aa0a6',
}
const STAMP_LABEL = {
  Collected: 'Collected',
  InAnalysis: 'In analysis',
  Stored: 'Stored',
  Released: 'Released',
  Disposed: 'Disposed',
  Voided: 'Void',
}
const ROLE_LABEL = {
  Admin: 'Admin',
  Investigator: 'Investigator',
  Analyst: 'Analyst',
  Auditor: 'Auditor',
}

export default function AdminDash({
  evidence,
  cases,
  users,
  name,
  onOpenEvidence,
  onOpenCase,
  onManageUsers,
  onOpenLog,
  me,
}) {
  const activeCases = cases.filter((c) => c.status !== 'Closed')
  const recentEvidence = [...evidence]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 8)
  const counts = Object.keys(STATUS).map((s) => ({
    s,
    n: evidence.filter((e) => e.status === s).length,
  }))
  const totalActive = evidence.filter(
    (e) => !['Voided', 'Released', 'Disposed'].includes(e.status),
  ).length
  const myName = me?.user?.name || ''
  const greeting = myName ? `Hello, ${myName.split(' ')[0]}` : 'Dashboard'
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const chainLog = [...evidence]
    .filter((e) => e.createdAt)
    .map((e) => {
      const byWallet = e.registeredBy || e.holder
      const byUser = users.find((u) => u.wallet?.toLowerCase() === byWallet?.toLowerCase())
      return {
        type: 'Registration',
        id: e.id,
        by: byUser?.name || name(byWallet),
        at: Number(e.createdAt) * 1000,
        block: e.blockNumber,
      }
    })
    .sort((a, b) => b.at - a.at)
    .slice(0, 10)

  const registeredUsers = users.filter((u) => u.role !== 'None')

  return (
    <div className="admin-dash">
      {/* Header */}
      <div className="admin-header">
        <div>
          <p className="admin-date">{today}</p>
          <h1 className="admin-greet">{greeting}</h1>
        </div>
        <div className="admin-header-actions">
          <button className="secondary" onClick={onOpenLog}>
            Activity log
          </button>
          <button onClick={onManageUsers}>Add user</button>
        </div>
      </div>

      {/* User rail */}
      <div className="admin-users-section">
        <div className="admin-section-title">
          <div className="admin-section-label">
            <h2>Registered users</h2>
            <span className="adm-muted">
              {registeredUsers.length} {registeredUsers.length === 1 ? 'person' : 'people'}
            </span>
          </div>
          <button className="btn-text" onClick={onManageUsers}>
            Manage →
          </button>
        </div>
        <div className="admin-rail-wrap">
          <div className="admin-user-cards">
            {registeredUsers.map((u, i) => {
              const displayName = u.name || name(u.wallet)
              const ini = initials(u.name || 'U')
              const roleColor = ROLE_HEX[u.role] ?? '#9aa0a6'
              const rot = [-1.5, 1, -0.8, 1.6, -1.2][i % 5]
              return (
                <div
                  className="admin-id-card"
                  key={u.wallet}
                  style={{ transform: `rotate(${rot}deg)` }}
                >
                  <div className="admin-card-clip" />
                  <div className="admin-card-body">
                    <div className="admin-card-role-band" style={{ background: roleColor }}>
                      <span className="admin-card-role-label">{ROLE_LABEL[u.role] ?? u.role}</span>
                      <span className="admin-card-band-bar" />
                    </div>
                    <div className="admin-card-info">
                      <div className="admin-card-avatar">{ini}</div>
                      <div className="admin-card-text">
                        <p className="admin-card-name">{displayName}</p>
                        <p className="admin-card-unit">{u.unit || u.nip || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {!registeredUsers.length && (
              <p className="adm-muted" style={{ padding: '40px 0', fontSize: 14 }}>
                No registered users yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Evidence + Chain row */}
      <div className="admin-main">
        <div className="admin-left">
          {/* Evidence table */}
          <div className="admin-section-title">
            <h2>Recent evidence</h2>
            <div className="admin-ev-meta">
              <span className="admin-ev-count">{totalActive} active</span>
              <div className="admin-ev-bar">
                {counts
                  .filter((x) => x.n > 0)
                  .map(({ s, n }) => (
                    <span
                      key={s}
                      className="admin-ev-seg"
                      title={`${STATUS[s].label}: ${n}`}
                      style={{ background: STATUS[s].color, flex: n }}
                    />
                  ))}
              </div>
              <span className="admin-ev-detail adm-muted">
                {counts
                  .filter((x) => x.n > 0)
                  .map(({ s, n }) => `${n} ${STATUS[s].label.toLowerCase()}`)
                  .join(', ')}
              </span>
            </div>
          </div>
          <div className="admin-ev-table-wrap">
            <div className="admin-ev-scroll">
              <table className="admin-ev-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Evidence</th>
                    <th>Holder</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvidence.map((e) => {
                    const isVoid = e.status === 'Voided'
                    const col = STAMP_HEX[e.status] ?? '#9aa0a6'
                    return (
                      <tr
                        key={e.id}
                        className={isVoid ? 'void-row' : ''}
                        onClick={() => onOpenEvidence(e.id)}
                      >
                        <td className="adm-mono">{evidenceCode(e.id)}</td>
                        <td className="admin-ev-name">{e.kind}</td>
                        <td className="admin-ev-holder">{name(e.holder)}</td>
                        <td>
                          <span
                            className="admin-ev-stamp"
                            style={{ color: col, border: `1.5px solid ${col}` }}
                          >
                            {STAMP_LABEL[e.status] ?? e.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {!recentEvidence.length && (
                    <tr>
                      <td colSpan={4} className="admin-ev-empty">
                        No evidence yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chain log */}
        <div className="admin-right">
          <div className="admin-section-title">
            <h2>Recent chain</h2>
            <button className="btn-text" onClick={onOpenLog}>
              Open log →
            </button>
          </div>
          <div className="admin-chain-wrap">
            <div className="admin-chain-scroll">
              {chainLog.map((entry, i) => (
                <div key={i} className="admin-chain-entries">
                  <div
                    className={`admin-chain-entry${i === 0 ? ' admin-chain-entry-highlight' : ''}`}
                    onClick={() => onOpenEvidence(entry.id)}
                  >
                    <div className="admin-chain-entry-head">
                      <div className="admin-chain-entry-action">
                        {i === 0 && <span className="admin-chain-dot" />}
                        <span className="admin-chain-verb">{entry.type}</span>
                        <span className="adm-mono admin-chain-id">{evidenceCode(entry.id)}</span>
                      </div>
                      <span className="admin-chain-time">
                        {entry.at
                          ? new Date(entry.at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            }) +
                            ', ' +
                            new Date(entry.at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>
                    <p className="admin-chain-by">by {entry.by}</p>
                    {entry.block && (
                      <p className="admin-chain-block adm-mono">
                        block {Number(entry.block).toLocaleString('en-US')}
                      </p>
                    )}
                  </div>
                  {i < chainLog.length - 1 && (
                    <div className="admin-chain-link">
                      <div className="admin-chain-link-line" />
                      <div className="admin-chain-link-node" />
                    </div>
                  )}
                </div>
              ))}
              {!chainLog.length && (
                <p className="adm-muted" style={{ fontSize: 14, padding: '20px 24px' }}>
                  No transactions yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cases — full width below */}
      <div className="admin-section-title" style={{ marginTop: 28 }}>
        <h2>Active cases</h2>
        <span className="adm-muted">{activeCases.length} kasus</span>
      </div>
      <div className="admin-case-cards">
        {activeCases.slice(0, 5).map((c) => {
          const evCount = evidence.filter((e) => e.caseId === c.no).length
          const caseColor = CASE_COLOR[c.status] ?? 'var(--blue)'
          const statusLabel = c.status
          return (
            <button key={c.no} className="admin-case-card" onClick={() => onOpenCase(c.no)}>
              <div className="admin-case-tab" />
              <div className="admin-case-body">
                <p className="admin-case-no adm-mono">{c.no}</p>
                <p className="admin-case-title">{c.title}</p>
                <div className="admin-case-foot">
                  <span className="admin-case-ev">
                    {evCount} {evCount === 1 ? 'item' : 'items'}
                  </span>
                  <span className="admin-case-status">
                    <i className="adm-dot" style={{ background: caseColor }} />
                    {statusLabel}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
        {!activeCases.length && (
          <p className="adm-muted" style={{ fontSize: 14 }}>
            No active cases.
          </p>
        )}
      </div>
    </div>
  )
}
