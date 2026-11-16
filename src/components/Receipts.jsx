import { createPortal } from 'react-dom'
import { useStore } from '../store/AppStore'
import { shortTx } from '../lib/format'
import { Close } from './Icons'
import './popups.css'

function Slip({ r, onClose }) {
  return (
    <div className="slip">
      <svg className="slip-check" width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--green)">
        <circle cx="18" cy="18" r="16" strokeWidth="2" />
        <circle cx="18" cy="18" r="12" strokeOpacity="0.4" />
        <path d="M12 18.5L16 22.5L24 14" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="slip-text">
        <b>{r.title}</b>
        {r.body && <span>{r.body}</span>}
        {r.tx && <span className="mono">tx {shortTx(r.tx)}</span>}
      </div>
      <button className="icon-btn" onClick={onClose} aria-label="Tutup">
        <Close size={14} />
      </button>
    </div>
  )
}

export default function Receipts() {
  const { receipts, dismiss } = useStore()
  if (!receipts.length) return null
  return createPortal(
    <div className="slips">
      {receipts.map((r) => (
        <Slip key={r.id} r={r} onClose={() => dismiss(r.id)} />
      ))}
    </div>,
    document.body,
  )
}
