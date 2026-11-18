import { useState, useMemo } from 'react'
import { initials, shortAddr } from '../lib/format'
import './usermanager.css'

const ROLE_HEX = {
  Admin: '#e8452c',
  Investigator: '#2d5be3',
  Analyst: '#e8a317',
  Auditor: '#1f9d63',
}
const ROLE_ORDER = ['Admin', 'Investigator', 'Analyst', 'Auditor']

/* ── Clipboard modal shell ──────────────────────────────────────────────── */
function Board({ title, onClose, children }) {
  return (
    <div className="um-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="um-board" role="dialog" aria-modal="true">
        <span className="um-board-clip" aria-hidden="true" />
        <div className="um-sheet">
          <div className="um-sheet-head">
            <h2>{title}</h2>
            <button className="um-close" onClick={onClose} aria-label="Tutup">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── Add / edit form ────────────────────────────────────────────────────── */
function UserForm({ user, onSubmit, onClose, busy }) {
  const edit = !!user
  return (
    <Board title={edit ? 'Edit user' : 'Add user'} onClose={onClose}>
      <form
        className="um-form"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(new FormData(e.currentTarget), edit)
        }}
      >
        <div className="um-row">
          <label className="um-field">
            <span className="um-label">
              Full name <i>*</i>
            </span>
            <input name="name" required defaultValue={user?.name || ''} placeholder="Full name" />
          </label>
          <label className="um-field">
            <span className="um-label">
              On-chain role <i>*</i>
            </span>
            <span className="um-select">
              <select name="role" required defaultValue={user?.role || ''}>
                <option value="" disabled>
                  Select a role
                </option>
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <svg className="um-caret" width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path
                  d="M1 1l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </label>
        </div>

        <label className="um-field">
          <span className="um-label">
            Wallet address <i>*</i>
          </span>
          <span className="um-input-lock">
            <input
              name="wallet"
              required
              pattern="0x[a-fA-F0-9]{40}"
              defaultValue={user?.wallet || ''}
              placeholder="0x…"
              readOnly={edit}
              className={edit ? 'is-locked' : ''}
            />
            {edit && (
              <svg className="um-lock" width="12" height="13" viewBox="0 0 12 13" fill="none">
                <rect
                  x="1.5"
                  y="5.5"
                  width="9"
                  height="6.5"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M3.75 5.5V3.75a2.25 2.25 0 014.5 0V5.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
            )}
          </span>
        </label>

        <div className="um-row">
          <label className="um-field">
            <span className="um-label">Staff ID</span>
            <input name="nip" defaultValue={user?.nip || ''} placeholder="Staff ID" />
          </label>
          <label className="um-field">
            <span className="um-label">Unit</span>
            <input name="unit" defaultValue={user?.unit || ''} placeholder="Unit" />
          </label>
        </div>

        <label className="um-field">
          <span className="um-label">
            Email <i>*</i>
          </span>
          <input
            name="email"
            type="email"
            required
            defaultValue={user?.email || ''}
            placeholder="name@evichain.id"
          />
        </label>

        <p className={edit ? 'um-note um-note-warn' : 'um-note um-note-info'}>
          {edit
            ? 'The wallet cannot be changed. Switching role requires revokeRole followed by grantRole.'
            : 'The role is granted through a grantRole transaction from the Admin wallet.'}
        </p>

        <div className="um-actions">
          <button type="button" className="um-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="um-primary" disabled={busy}>
            {edit ? 'Save' : 'Save and grantRole'}
          </button>
        </div>
      </form>
    </Board>
  )
}

/* ── Delete confirm ─────────────────────────────────────────────────────── */
function DeleteConfirm({ user, onConfirm, onClose, busy }) {
  const hex = ROLE_HEX[user.role] ?? '#9aa0a6'
  return (
    <Board title="Delete user" onClose={onClose}>
      <div className="um-mini">
        <div className="um-mini-band" style={{ background: hex }}>
          {user.role}
        </div>
        <div className="um-mini-body">
          <span className="um-mini-avatar">{initials(user.name || 'U')}</span>
          <div className="um-mini-text">
            <b>{user.name}</b>
            <span>{user.unit || '—'}</span>
            <span className="um-mono">{shortAddr(user.wallet)}</span>
          </div>
          <span className="um-stamp">Role revoked</span>
        </div>
      </div>

      <p className="um-delete-copy">
        The {user.role} role for <b>{user.name}</b> is revoked on-chain via revokeRole and the
        profile is deleted from the database.
      </p>
      <p className="um-note um-note-danger">
        {user.name?.split(' ')[0]}&rsquo;s activity history on the blockchain is permanent and is
        not deleted.
      </p>

      <div className="um-actions">
        <button type="button" className="um-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="um-danger" disabled={busy} onClick={onConfirm}>
          Revoke role and delete
        </button>
      </div>
    </Board>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function UserManager({ users, me, busy, onAdd, onEdit, onDelete, evidence = [] }) {
  const [role, setRole] = useState(null)
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)

  const people = useMemo(() => users.filter((u) => u.role && u.role !== 'None'), [users])

  const counts = useMemo(() => {
    const c = {}
    people.forEach((u) => {
      c[u.role] = (c[u.role] || 0) + 1
    })
    return c
  }, [people])

  const held = useMemo(() => {
    const c = {}
    evidence.forEach((e) => {
      if (['Voided', 'Released', 'Disposed'].includes(e.status)) return
      const w = e.holder?.toLowerCase()
      if (w) c[w] = (c[w] || 0) + 1
    })
    return c
  }, [evidence])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return people.filter((u) => {
      if (role && u.role !== role) return false
      if (!q) return true
      return [u.name, u.unit, u.wallet, u.email].some((v) => (v || '').toLowerCase().includes(q))
    })
  }, [people, role, query])

  function submit(fd, isEdit) {
    const data = Object.fromEntries(fd)
    if (isEdit) onEdit(data, () => setEditing(null))
    else onAdd(data, () => setAdding(false))
  }

  return (
    <div className="um">
      <header className="um-head">
        <h1>Users</h1>
        <button className="um-add" onClick={() => setAdding(true)}>
          Add user
        </button>
      </header>

      <div className="um-toolbar">
        <span className="um-search">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.4" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M9.6 9.6L12.2 12.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            placeholder="Search name, unit, or wallet"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </span>

        <div className="um-tabs">
          <button className={!role ? 'um-tab is-on' : 'um-tab'} onClick={() => setRole(null)}>
            All <b>{people.length}</b>
          </button>
          {ROLE_ORDER.filter((r) => counts[r]).map((r) => (
            <button
              key={r}
              className={role === r ? 'um-tab is-on' : 'um-tab'}
              onClick={() => setRole((p) => (p === r ? null : r))}
            >
              <i className="um-dot" style={{ background: ROLE_HEX[r] }} />
              {r} <b>{counts[r]}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="um-grid">
        {shown.map((u) => {
          const hex = ROLE_HEX[u.role] ?? '#9aa0a6'
          const self = u.wallet?.toLowerCase() === me?.wallet?.toLowerCase()
          const n = held[u.wallet?.toLowerCase()] || 0
          return (
            <article className="um-card" key={u.wallet}>
              <span className="um-clip" aria-hidden="true" />
              <div className="um-band" style={{ background: hex }}>
                <span className="um-band-role">
                  {u.role}
                  {self && <em className="um-you">You</em>}
                </span>
                <span className="um-band-slot" aria-hidden="true" />
              </div>

              <div className="um-body">
                <div className="um-person">
                  <span className="um-avatar">{initials(u.name || 'U')}</span>
                  <div className="um-person-text">
                    <b className="um-name">{u.name || '—'}</b>
                    {u.email && <span className="um-email">{u.email}</span>}
                    {u.unit && <span className="um-unit">{u.unit}</span>}
                  </div>
                </div>

                <div className="um-foot">
                  <span className="um-wallet um-mono">{shortAddr(u.wallet)}</span>
                  <span className="um-held">
                    {n} {n === 1 ? 'item' : 'items'} held
                  </span>
                  <span className="um-tools">
                    <button className="um-icon" title="Edit" onClick={() => setEditing(u)}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M11.3 2.2l2.5 2.5-8.4 8.4-3.1.6.6-3.1 8.4-8.4z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {!self && (
                      <button
                        className="um-icon um-icon-del"
                        title="Delete"
                        onClick={() => setRemoving(u)}
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M2.8 4.2h10.4M6.4 4.2V2.6h3.2v1.6M4.3 4.2l.6 9h6.2l.6-9"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </article>
          )
        })}

        {!shown.length && <p className="um-empty">No users match.</p>}
      </div>

      {adding && (
        <UserForm user={null} onSubmit={submit} onClose={() => setAdding(false)} busy={busy} />
      )}
      {editing && (
        <UserForm user={editing} onSubmit={submit} onClose={() => setEditing(null)} busy={busy} />
      )}
      {removing && (
        <DeleteConfirm
          user={removing}
          busy={busy}
          onClose={() => setRemoving(null)}
          onConfirm={() => onDelete(removing, () => setRemoving(null))}
        />
      )}
    </div>
  )
}
