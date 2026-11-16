import { ROLE_COLOR, initials, shortAddr } from '../lib/format'
import './idcard.css'

const Clip = () => (
  <svg className="id-clip" width="40" height="42" viewBox="0 0 40 42">
    <defs>
      <linearGradient id="idclip" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#9AA3A9" />
        <stop offset="0.5" stopColor="#E4E8EA" />
        <stop offset="1" stopColor="#8E979D" />
      </linearGradient>
    </defs>
    <rect x="14" y="0" width="12" height="22" rx="6" stroke="url(#idclip)" strokeWidth="3" fill="none" />
    <rect x="8" y="20" width="24" height="14" rx="4" fill="url(#idclip)" />
    <rect x="16" y="32" width="8" height="10" rx="2" fill="#B9C0C5" />
  </svg>
)

export default function IdCard({ user, variant = 'hang', isMe, held, actions, tilt = 0, children }) {
  const color = ROLE_COLOR[user.role]

  if (variant === 'full') {
    return (
      <div className="id-wrap" style={{ transform: `rotate(${tilt}deg)` }}>
        <Clip />
        <div className="id-card full">
          <div className="id-band" style={{ background: color }}>
            <span>
              {user.role}
              {isMe && <em>Anda</em>}
            </span>
            <i />
          </div>
          <div className="id-body">
            <div className="id-photo lg">{initials(user.name)}</div>
            <div className="id-text">
              <h3>{user.name}</h3>
              <span className="muted">{user.email}</span>
              <b>{user.unit}</b>
            </div>
          </div>
          <div className="id-foot">
            <div className="id-foot-left">
              <span className="mono id-wallet">{shortAddr(user.wallet)}</span>
              <span className="muted">{held} bukti dipegang</span>
            </div>
            <div className="id-actions">{actions}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`id-wrap ${variant}`} style={{ transform: `rotate(${tilt}deg)` }}>
      {variant === 'hang' && <Clip />}
      <div className="id-card">
        <div className="id-band" style={{ background: color }}>
          <span>{user.role}</span>
          <i />
        </div>
        <div className="id-body">
          <div className="id-photo">{initials(user.name)}</div>
          <div className="id-text">
            <b className="name">{user.name}</b>
            <span className="muted">{variant === 'flat' ? shortAddr(user.wallet) : user.unit}</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
