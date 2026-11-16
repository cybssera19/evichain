import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Close } from './Icons'
import './clipboard.css'

const Clip = () => (
  <svg className="clip" width="190" height="64" viewBox="0 0 190 64">
    <defs>
      <linearGradient id="clipmetal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E9ECEE" />
        <stop offset="0.5" stopColor="#B7BEC3" />
        <stop offset="1" stopColor="#8E979D" />
      </linearGradient>
    </defs>
    <path d="M60 6C60 2.7 62.7 0 66 0H124C127.3 0 130 2.7 130 6V18H60Z" fill="url(#clipmetal)" />
    <rect x="82" y="5" width="26" height="8" rx="4" fill="#5D666C" />
    <path d="M8 22C8 19.8 9.8 18 12 18H178C180.2 18 182 19.8 182 22V44C182 52.8 174.8 60 166 60H24C15.2 60 8 52.8 8 44Z" fill="url(#clipmetal)" />
    <path d="M20 30H170" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.5" />
  </svg>
)

export function Board({ width = 540, children }) {
  return (
    <div className="clipboard" style={{ width: width + 48 }}>
      <Clip />
      <div className="clip-paper">{children}</div>
    </div>
  )
}

export function ClipHead({ title, sub, onClose }) {
  return (
    <div className="clip-head">
      <div>
        <h2>{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {onClose && (
        <button className="icon-btn" onClick={onClose} aria-label="Tutup">
          <Close />
        </button>
      )}
    </div>
  )
}

export function ClipFoot({ children }) {
  return <div className="clip-foot">{children}</div>
}

export default function ClipboardModal({ open, onClose, width, title, sub, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <Board width={width}>
        <ClipHead title={title} sub={sub} onClose={onClose} />
        {children}
      </Board>
    </div>,
    document.body,
  )
}
