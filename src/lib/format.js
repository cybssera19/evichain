const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const fullMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const pad = (n) => String(n).padStart(2, '0')

export function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function formatTime(iso) {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDateTime(iso) {
  return `${formatDate(iso)}, ${formatTime(iso)}`
}

export function formatShort(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${months[d.getMonth()]}, ${formatTime(iso)}`
}

export function formatToday(d = new Date()) {
  return `${days[d.getDay()]}, ${d.getDate()} ${fullMonths[d.getMonth()]} ${d.getFullYear()}`
}

export const formatBlock = (n) => n.toLocaleString('en-US')

export function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toLocaleString('en-US', { maximumFractionDigits: 1 })} ${units[i]}`
}

export const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '')
export const shortHash = (h) => (h ? `${h.slice(0, 8)}…${h.slice(-6)}` : '')
export const shortTx = (t) => (t ? `${t.slice(0, 6)}…${t.slice(-4)}` : '')

export const evidenceCode = (id) => `#${String(id).padStart(3, '0')}`

export const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const STATUS = {
  Collected: { label: 'Collected', color: 'var(--blue)' },
  InAnalysis: { label: 'In analysis', color: 'var(--amber)' },
  Stored: { label: 'Stored', color: 'var(--green)' },
  Released: { label: 'Released', color: 'var(--desk)' },
  Disposed: { label: 'Disposed', color: 'var(--ink-soft)' },
  Voided: { label: 'Void', color: 'var(--void)' },
}

export const FINAL_STATUS = ['Released', 'Disposed', 'Voided']

export const ROLE_COLOR = {
  Admin: 'var(--red)',
  Investigator: 'var(--blue)',
  Analyst: 'var(--amber)',
  Auditor: 'var(--green)',
}

export const CASE_COLOR = {
  Investigation: 'var(--blue)',
  Filing: 'var(--amber)',
  Closed: 'var(--green)',
}
