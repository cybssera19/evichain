import { useRef, useState } from 'react'
import './bag.css'

// kantong bukti plastik, bisa jadi tempat seret file
export default function Bag({ onFile, children, className = '' }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)

  const take = (files) => {
    if (files?.[0]) onFile?.(files[0])
  }

  return (
    <div
      className={`bag ${onFile ? 'droppable' : ''} ${over ? 'over' : ''} ${className}`}
      onClick={() => onFile && input.current?.click()}
      onDragOver={(e) => {
        if (!onFile) return
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!onFile) return
        e.preventDefault()
        setOver(false)
        take(e.dataTransfer.files)
      }}
    >
      <span className="bag-zip" />
      <span className="bag-shine" />
      <div className="bag-label" onClick={(e) => onFile || e.stopPropagation()}>
        {children}
      </div>
      {onFile && <input ref={input} type="file" hidden onChange={(e) => take(e.target.files)} />}
    </div>
  )
}
