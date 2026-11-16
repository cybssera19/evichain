import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useLookup } from '../store/AppStore'
import { formatDate, initials } from '../lib/format'
import { CaseSticker } from './Status'
import { MiniTag } from './Tags'
import './folder.css'

const tilts = [3, -2.5, 2, -1.5]

// kata yang ada tanda hubungnya jangan sampai patah di tengah
export const keepHyphen = (text) =>
  text.split(' ').map((w, i) => (
    <Fragment key={i}>
      {i ? ' ' : ''}
      <span style={w.includes('-') ? { whiteSpace: 'nowrap' } : undefined}>{w}</span>
    </Fragment>
  ))

export function shortName(name) {
  if (name.includes('(salinan)')) return `${name.split(' ')[0]} salinan`
  return name.split(' ').slice(0, 2).join(' ')
}

export default function Folder({ kase, items, meId, variant = 'desk' }) {
  const { user, eventsOf } = useLookup()
  const mine = items.filter((i) => i.holder === meId && i.status !== 'Voided').length
  const lastUpdate = items
    .flatMap((i) => eventsOf(i.id))
    .reduce((max, e) => (e.at > max ? e.at : max), kase.createdAt)
  const creator = user(kase.createdBy)

  return (
    <div className="folder">
      <div className="folder-tab mono">{kase.no}</div>
      <div className="folder-back" />
      <div className="folder-paper one" />
      <div className="folder-paper two">
        <i />
        <i />
        <i />
      </div>

      {items.length ? (
        items.slice(0, 4).map((item, i) => (
          <div key={item.id} className="folder-slot" style={{ left: 40 + i * 84, top: 44 + (i % 2) * 8 }}>
            <MiniTag item={item} tilt={tilts[i]} short={shortName(item.name)} />
          </div>
        ))
      ) : (
        <span className="folder-empty">Belum ada barang bukti</span>
      )}

      <Link to={`/kasus/${kase.no}`} className="folder-front">
        <div>
          <CaseSticker status={kase.status} />
          <h3>{keepHyphen(kase.title)}</h3>
        </div>
        {variant === 'desk' ? (
          <div className="folder-foot">
            <span>
              {items.length} bukti{mine ? `, ${mine} di tangan Anda` : ''}
            </span>
            <span className="light">Diperbarui {formatDate(lastUpdate).replace(/ \d{4}$/, '')}</span>
          </div>
        ) : (
          <div className="folder-foot">
            <span className="who">
              <span className="avatar">{creator ? initials(creator.name) : '?'}</span>
              {creator?.name ?? 'Pengguna dihapus'}, {formatDate(kase.createdAt)}
            </span>
            <span className="strong">{items.length} bukti</span>
          </div>
        )}
      </Link>
    </div>
  )
}
