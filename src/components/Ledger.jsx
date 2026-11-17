import { ChevronRight } from './Icons'
import './ledger.css'

export default function Ledger({ columns, rows, rowKey, onRowClick, highlight, footer, compact }) {
  const template = columns.map((c) => c.width ?? '1fr').join(' ') + (onRowClick ? ' 24px' : '')

  return (
    <div className={`ledger ${compact ? 'compact' : ''}`}>
      <span className="ledger-margin" />
      <span className="ledger-holes">
        <i />
        <i />
        <i />
      </span>
      <div className="ledger-table">
        <div className="ledger-row head" style={{ gridTemplateColumns: template }}>
          {columns.map((c) => (
            <span key={c.key}>{c.label}</span>
          ))}
          {onRowClick && <span />}
        </div>
        {rows.map((row) => {
          const key = rowKey(row)
          return (
            <div
              key={key}
              className={`ledger-row ${onRowClick ? 'clickable' : ''} ${highlight === key ? 'marked' : ''}`}
              style={{ gridTemplateColumns: template }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <span key={c.key} className="cell">
                  {c.render(row)}
                </span>
              ))}
              {onRowClick && (
                <span className="chev">
                  <ChevronRight size={16} />
                </span>
              )}
            </div>
          )
        })}
        {!rows.length && <p className="ledger-empty">No matching records.</p>}
        {footer && <div className="ledger-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Pager({ page, pages, onChange }) {
  return (
    <div className="pager">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {Array.from({ length: pages }, (_, i) => (
        <button key={i} className={page === i + 1 ? 'on' : ''} onClick={() => onChange(i + 1)}>
          {i + 1}
        </button>
      ))}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  )
}
