import { CaseSticker, StatusStamp } from './Status'
import { MiniTag, RowTag } from './Tags'
import { TapeH } from './Tape'
import { formatToday } from '../lib/format'
import './folder.css'

export function LiveFolder({ kase, items, onOpen }) {
  const Front = onOpen ? 'button' : 'div'
  return (
    <div className="folder live-folder">
      <div className="folder-tab mono">{kase.no}</div>
      <div className="folder-back" />
      <div className="folder-paper one" />
      <div className="folder-paper two">
        <i />
        <i />
        <i />
      </div>
      {items.length ? (
        items
          .slice(0, 4)
          .map((item, i) => (
            <MiniTag
              key={item.id}
              item={item}
              tilt={[3, -2.5, 2, -1.5][i]}
              style={{ left: 36 + i * 58, top: 45 + (i % 2) * 14 }}
              onClick={() => onOpen?.(item.id)}
            />
          ))
      ) : (
        <span className="folder-empty">No evidence yet</span>
      )}
      <Front
        type={onOpen ? 'button' : undefined}
        className="folder-front"
        onClick={onOpen ? () => onOpen(kase.no) : undefined}
      >
        <div>
          <CaseSticker status={kase.status} />
          <h3>{kase.title}</h3>
        </div>
        <div className="folder-foot">
          <span>
            {items.length} evidence {items.length === 1 ? 'item' : 'items'}
          </span>
          {onOpen && <span className="light">View cases →</span>}
        </div>
      </Front>
    </div>
  )
}

export function LiveRecent({ items, onOpen }) {
  return (
    <TapeH
      segments={(items.length ? items : [null]).map((item) =>
        item ? (
          <button type="button" className="live-segment" onClick={() => onOpen(item.id)}>
            <span className="seg-block mono">EVIDENCE #{String(item.id).padStart(3, '0')}</span>
            <span className="entry-title">
              <RowTag status={item.status} />
              <b>{item.kind}</b>
            </span>
            <span className="mono muted">Case {item.caseId}</span>
            <StatusStamp status={item.status} />
          </button>
        ) : (
          <p className="muted">No evidence recorded yet.</p>
        ),
      )}
    />
  )
}

export function Today() {
  return <p className="date">{formatToday()}</p>
}
