import { Fragment } from 'react'
import { useSize } from '../lib/useSize'
import { LinkHorizontal, LinkVertical } from './Icons'
import './tape.css'

const HOLE = '#0C3B30'

export function TapeH({ segments, bars = true, className = '' }) {
  const [ref, { width: W, height: H }] = useSize()
  const n = segments.length
  const inner = W - 30
  const sw = n ? inner / n : 0

  let zig = ''
  for (let y = 0; y <= H; y += 10) zig += ` L${(y / 10) % 2 === 0 ? W : W - 10} ${y}`

  return (
    <div ref={ref} className={`tape-h ${className}`}>
      {W > 0 && (
        <svg className="tape-bg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <path d={`M0 0 L${W} 0${zig} L0 ${H} Z`} fill="#FBF7EC" />
          {bars &&
            segments.map((_, i) =>
              i % 2 === 0 ? (
                <rect key={i} x={10 + i * sw} y="28" width={sw} height={H - 56} fill="#E7EFDF" />
              ) : null,
            )}
          <path
            d={`M0 27.5H${W - 12}M0 ${H - 27.5}H${W - 12}`}
            stroke="#D8CFB6"
            strokeDasharray="2 3"
          />
          {segments.slice(1).map((_, i) => (
            <path
              key={i}
              d={`M${10 + (i + 1) * sw} 28V${H - 28}`}
              stroke="#C9C0A6"
              strokeDasharray="3 4"
            />
          ))}
          {Array.from({ length: Math.max(0, Math.floor((W - 44) / 26)) }, (_, i) => (
            <Fragment key={i}>
              <circle cx={20 + i * 26} cy="13" r="4.2" fill={HOLE} />
              <circle cx={20 + i * 26} cy={H - 13} r="4.2" fill={HOLE} />
            </Fragment>
          ))}
        </svg>
      )}
      <div className="tape-h-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {segments.map((seg, i) => (
          <div key={i} className="tape-h-seg">
            {seg}
            {i < n - 1 && (
              <span className="tape-h-link">
                <LinkHorizontal bg="transparent" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TapeV({ entries, highlightLast, highlightFirst, className = '' }) {
  const [ref, { width: W, height: H }] = useSize()

  let zig = ''
  for (let x = W; x >= 0; x -= 12) zig += ` L${x} ${((W - x) / 12) % 2 === 0 ? H : H - 9}`

  return (
    <div ref={ref} className={`tape-v ${className}`}>
      {W > 0 && (
        <svg className="tape-bg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <path
            d={`M0 4C0 1.8 1.8 0 4 0H${W - 4}C${W - 2} 0 ${W} 1.8 ${W} 4V${H - 9}${zig} Z`}
            fill="#FBF7EC"
          />
          <path
            d={`M28.5 0V${H - 10}M${W - 28.5} 0V${H - 10}`}
            stroke="#D8CFB6"
            strokeDasharray="2 3"
          />
          {Array.from({ length: Math.max(0, Math.floor((H - 24) / 24)) }, (_, i) => (
            <Fragment key={i}>
              <circle cx="14" cy={16 + i * 24} r="4" fill={HOLE} />
              <circle cx={W - 14} cy={16 + i * 24} r="4" fill={HOLE} />
            </Fragment>
          ))}
        </svg>
      )}
      <div className="tape-v-list">
        {entries.map((entry, i) => {
          const hot = (highlightLast && i === entries.length - 1) || (highlightFirst && i === 0)
          return (
            <Fragment key={i}>
              <div className={`tape-v-entry ${hot ? 'hot' : ''}`}>{entry}</div>
              {i < entries.length - 1 && (
                <div className="tape-v-joint">
                  <LinkVertical />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
