import { RoleChip, StatusStamp } from './Status'
import { RowTag } from './Tags'
import { evidenceCode, initials, formatDate } from '../lib/format'
import './profile.css'

const fromUnix = (sec) => formatDate(new Date(Number(sec) * 1000).toISOString())

export default function Profile({
  me,
  profile,
  held,
  registered,
  chainId,
  contract,
  onOpenEvidence,
  onSignOut,
}) {
  const display = profile?.name || 'Unnamed user'
  return (
    <div className="grid profile-grid">
      <section className="panel profile-card">
        <div className="profile-id">
          <span className="profile-avatar">{initials(display)}</span>
          <div>
            <h2>{display}</h2>
            <RoleChip role={me.role} />
          </div>
        </div>
        <div className="info">
          <span className="muted">Wallet</span>
          <b className="mono">{me.wallet}</b>
        </div>
        <div className="info">
          <span className="muted">Staff ID</span>
          <b>{profile?.nip || '-'}</b>
        </div>
        <div className="info">
          <span className="muted">Unit</span>
          <b>{profile?.unit || '-'}</b>
        </div>
        <div className="info">
          <span className="muted">Email</span>
          <b>{profile?.email || '-'}</b>
        </div>
        <p className="muted profile-note">
          Your identity is proven by a wallet signature, not a password. Only an Admin can change
          your role, and the change is recorded on-chain.
        </p>
        <button className="quiet" onClick={onSignOut}>
          Sign out
        </button>
      </section>

      <div className="profile-side">
        <section className="panel">
          <h2>Session</h2>
          <div className="info">
            <span className="muted">Network</span>
            <b>Chain {chainId}</b>
          </div>
          <div className="info">
            <span className="muted">Role contract</span>
            <b className="mono">{contract}</b>
          </div>
          <div className="info">
            <span className="muted">Evidence registered</span>
            <b>{registered.length}</b>
          </div>
          <div className="info">
            <span className="muted">Evidence held</span>
            <b>{held.length}</b>
          </div>
        </section>

        <section className="panel">
          <h2>
            Evidence in your custody<span className="count">{held.length}</span>
          </h2>
          {held.length ? (
            <ul className="profile-list">
              {held.map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => onOpenEvidence(e.id)}>
                    <RowTag status={e.status} size={18} />
                    <span className="mono">{evidenceCode(e.id)}</span>
                    <b>{e.kind}</b>
                    <span className="muted">{e.caseId}</span>
                    <span className="profile-list-date">{fromUnix(e.createdAt)}</span>
                    <StatusStamp status={e.status} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="profile-empty">You are not holding any evidence right now.</p>
          )}
        </section>
      </div>
    </div>
  )
}
