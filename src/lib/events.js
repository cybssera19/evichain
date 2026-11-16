import { STATUS } from './format'

export const EVENT_LABEL = {
  register: 'Registrasi',
  transfer: 'Transfer custody',
  analysis: 'Hasil analisis',
  metadata: 'Ubah metadata',
  status: 'Ubah status',
  void: 'Void',
}

export const EVENT_COLOR = {
  register: 'var(--blue)',
  transfer: '#7A5E2A',
  analysis: 'var(--amber-ink)',
  metadata: '#4F4838',
  status: 'var(--desk)',
  void: 'var(--red)',
}

export function eventWho(e, user, short) {
  const name = (id) => {
    const n = user(id)?.name ?? 'Pengguna dihapus'
    return short ? n.split(' ')[0] : n
  }
  if (e.type === 'transfer') return `${name(e.from)} ke ${short ? name(e.to) : user(e.to)?.name ?? 'Pengguna dihapus'}`
  if (e.type === 'status') return `oleh ${name(e.by)}, menjadi ${STATUS[e.status]?.label}`
  return `oleh ${name(e.by)}`
}
