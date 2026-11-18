import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { STATUS, evidenceCode } from '../lib/format'
import { useSize } from '../lib/useSize'
import './tags.css'

const bandColor = (status) => STATUS[status]?.color ?? 'var(--void)'

export function Barcode({ seed = 1, width = 52, height = 12, muted }) {
  const bars = useMemo(() => {
    let s = seed * 7919 + 13
    const rnd = () => (s = (s * 9301 + 49297) % 233280)
    const out = []
    let x = 0
    while (x < width - 2) {
      const w = 1 + (rnd() % 3)
      out.push([x, w])
      x += w + 1 + (rnd() % 3)
    }
    return out
  }, [seed, width])

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="barcode">
      {bars.map(([x, w]) => (
        <rect key={x} x={x} y="0" width={w} height={height} fill={muted ? '#AEB3B8' : '#1D1A14'} />
      ))}
    </svg>
  )
}

export function RowTag({ status, size = 20 }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 20 28">
      <path
        d="M5 0.5H15L19.5 5V26C19.5 26.8 18.8 27.5 18 27.5H2C1.2 27.5 0.5 26.8 0.5 26V5Z"
        fill="#FFFDF7"
        stroke="#CFC8B6"
      />
      <path d="M5 0.5H15L19.5 5V8H0.5V5Z" fill={bandColor(status)} />
      <circle cx="10" cy="4.2" r="1.6" fill="#F3EDDD" />
    </svg>
  )
}

export function MiniTag({ item, tilt = 0, short, onClick, style }) {
  const voided = item.status === 'Voided'
  const cls = `mini-tag ${voided ? 'voided' : ''}`
  const sty = { '--tilt': `${tilt}deg`, ...style }
  const inner = (
    <>
      <svg className="mini-tag-string" width="30" height="34" viewBox="0 0 30 34">
        <path
          d="M15 33C12 24 22 18 18 10C15 4 20 1 24 0"
          stroke="#6E5C38"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <svg className="mini-tag-shape" width="70" height="112" viewBox="0 0 70 112">
        <path
          d="M14 0.5H56L69.5 14V107.5C69.5 109.7 67.7 111.5 65.5 111.5H4.5C2.3 111.5 0.5 109.7 0.5 107.5V14Z"
          fill="#FCFBF7"
          stroke="#CFC8B6"
        />
        <path d="M14 0.5H56L69.5 14V23H0.5V14Z" fill={bandColor(item.status)} />
        <circle cx="35" cy="12" r="4.6" fill="#C99A48" stroke="#FCFBF7" strokeWidth="1.6" />
      </svg>
      <span className="mini-tag-id mono">{evidenceCode(item.id)}</span>
      <span className="mini-tag-name">{short ?? item.kind}</span>
      <span className="mini-tag-code">
        <Barcode seed={item.id} muted={voided} />
      </span>
    </>
  )
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls} style={sty}>
        {inner}
      </button>
    )
  return (
    <Link to={`/evidence/${item.id}`} className={cls} style={sty}>
      {inner}
    </Link>
  )
}

export function BigTag({
  status,
  width = 420,
  cut = 44,
  band = 66,
  hole = 12,
  className = '',
  children,
}) {
  const [ref, { height }] = useSize()
  const h = Math.max(height, band + 40)
  const w = width
  const path = `M${cut} 0.5H${w - cut}L${w - 0.5} ${cut}V${h - 12}C${w - 0.5} ${h - 5.6} ${
    w - 5.6
  } ${h - 0.5} ${w - 12} ${h - 0.5}H12C5.6 ${h - 0.5} 0.5 ${h - 5.6} 0.5 ${h - 12}V${cut}Z`
  const bandPath = `M${cut} 0.5H${w - cut}L${w - 0.5} ${cut}V${band}H0.5V${cut}Z`

  return (
    <div className={`big-tag ${className}`} style={{ width: w }}>
      <svg className="big-tag-shape" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id={`tagfill-${w}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFDF7" />
            <stop offset="1" stopColor="#F4EDDC" />
          </linearGradient>
        </defs>
        <path d={path} fill={`url(#tagfill-${w})`} stroke="#DCCFAE" />
        <path d={bandPath} fill={bandColor(status)} />
        <circle
          cx={w / 2}
          cy={band / 2}
          r={hole}
          fill="var(--hole, #0F4A3C)"
          stroke="#FFFDF7"
          strokeWidth="3"
        />
      </svg>
      <div ref={ref} className="big-tag-body" style={{ paddingTop: band + 30 }}>
        {children}
      </div>
    </div>
  )
}
