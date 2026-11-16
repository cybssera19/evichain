import { CASE_COLOR, ROLE_COLOR, STATUS } from '../lib/format'

export function StatusStamp({ status, size }) {
  const s = STATUS[status]
  const color = status === 'InAnalysis' ? 'var(--amber-ink)' : s.color
  return (
    <span className={`stamp ${size === 'lg' ? 'stamp-lg' : ''}`} style={{ color }}>
      {s.label}
    </span>
  )
}

export function StatusSticker({ status }) {
  const s = STATUS[status]
  return (
    <span className="sticker">
      <span className="dot" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

export function CaseSticker({ status }) {
  return (
    <span className="sticker">
      <span className="dot" style={{ background: CASE_COLOR[status] }} />
      {status}
    </span>
  )
}

export function RoleChip({ role, tone = 'tint' }) {
  return (
    <span className={`role-chip ${tone}`}>
      <span className="dot" style={{ background: ROLE_COLOR[role], width: 6, height: 6 }} />
      {role}
    </span>
  )
}
